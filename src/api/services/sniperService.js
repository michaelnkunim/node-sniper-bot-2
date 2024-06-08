const axios = require("axios");
const environment = require('../../../environment')
const { Wallet } = require("@project-serum/anchor");
const {
  Keypair,
  VersionedTransaction,
  Connection,
  Transaction,
  PublicKey,
  ComputeBudgetProgram,
  SystemProgram,
  LAMPORTS_PER_SOL,
  TransactionMessage,
  TransactionInstruction,
  AddressLookupTableAccount,
  sendAndConfirmTransaction,
  sendAndConfirmRawTransaction,
} = require("@solana/web3.js");
const { bs58 } = require("@coral-xyz/anchor/dist/cjs/utils/bytes");
const { getAssociatedTokenAddress, getAccount } = require("@solana/spl-token");
const wallet = new Wallet(
  Keypair.fromSecretKey(bs58.decode(environment.walletSecret || ""))
);
const connection = new Connection("https://api.mainnet-beta.solana.com");
const JUPITER_SWAP_ROUTE_API_URL = "https://quote-api.jup.ag/v6/quote";
const JUPITER_SWAP_URL = "https://quote-api.jup.ag/v6/swap";
const PRIORITY_RATE = 25000; // MICRO_LAMPORTS
const PRIORITY_FEE_INSTRUCTIONS = ComputeBudgetProgram.setComputeUnitPrice({
  microLamports: PRIORITY_RATE,
});

const confirmTransaction = async (req, res) => {
  const { transactionId } = req.body;
  try {
    const transactionDetails = await connection.getParsedTransaction(
      transactionId
    );
    if (
      transactionDetails &&
      transactionDetails.meta &&
      transactionDetails.meta.status
    ) {
      if (transactionDetails.meta.status.err === null) {
        console.log("Transaction confirmed:", transactionDetails);
      } else {
        console.log("Transaction failed:", transactionDetails.meta.status.err);
      }
    } else {
      console.log("Transaction not found or not confirmed yet");
    }
  } catch (error) {
    console.error("Error confirming transaction:", error);
  }
};

const swapToken = async (
  inputMint,
  outputMint,
  amount,
  response,
  sell = false
) => {
  try {
    let convertedAmount = 0;
    const responseData = {};
    let instructions = {};
    if (sell) {
      const tokenInfo = {};
      const tokenBalance = await getTokenBalance(inputMint);
      // eslint-disable-next-line no-undef
      convertedAmount = Number(tokenBalance.balance);
      Object.assign(responseData, { convertedAmount }, tokenInfo);
    } else {
      convertedAmount = amount * LAMPORTS_PER_SOL;
    }
    const quoteData = await geSwapRoute(
      inputMint,
      outputMint,
      convertedAmount,
      150
    );

    Object.assign(responseData, { amount: convertedAmount });

    if (
      quoteData["errorCode"] != "TOKEN_NOT_TRADABLE" &&
      quoteData["errorCode"] != "COULD_NOT_FIND_ANY_ROUTE"
    ) {
      instructions = await getInstructions(quoteData);
      Object.assign(responseData, { instructions });
      if (instructions.error) {
        throw new Error(
          "Failed to get swap instructions: " + instructions.error
        );
      }

      const {
        tokenLedgerInstruction, // If you are using `useTokenLedger = true`.
        computeBudgetInstructions, // The necessary instructions to setup the compute budget.
        setupInstructions, // Setup missing ATA for the users.
        swapInstruction: swapInstructionPayload, // The actual swap instruction.
        cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
        addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
      } = instructions;

      const deserializeInstruction = (instruction) => {
        return new TransactionInstruction({
          programId: new PublicKey(instruction.programId),
          keys: instruction.accounts.map((key) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })),
          data: Buffer.from(instruction.data, "base64"),
        });
      };

      const getAddressLookupTableAccounts = async (keys) => {
        const addressLookupTableAccountInfos =
          await connection.getMultipleAccountsInfo(
            keys.map((key) => new PublicKey(key))
          );

        return addressLookupTableAccountInfos.reduce(
          (acc, accountInfo, index) => {
            const addressLookupTableAddress = keys[index];
            if (accountInfo) {
              const addressLookupTableAccount = new AddressLookupTableAccount({
                key: new PublicKey(addressLookupTableAddress),
                state: AddressLookupTableAccount.deserialize(accountInfo.data),
              });
              acc.push(addressLookupTableAccount);
            }

            return acc;
          },
          []
        );
      };

      const addressLookupTableAccounts = [];

      addressLookupTableAccounts.push(
        ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
      );

      const blockhash = (await connection.getLatestBlockhash()).blockhash;
      const messageV0 = new TransactionMessage({
        payerKey: wallet.publicKey,
        recentBlockhash: blockhash,
        instructions: [deserializeInstruction(swapInstructionPayload)],
      }).compileToV0Message(addressLookupTableAccounts);
      const transaction = new VersionedTransaction(messageV0);

      transaction.sign([wallet.payer]);
      const rawTransaction = transaction.serialize();

      const txSig = await sendAndConfirmRawTransaction(
        connection,
        rawTransaction,
        //  [wallet, outputMint],
        { skipPreflight: true, commitment: "processed", maxRetries: 6 }
      );

      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const res = await connection.getSignatureStatuses([txSig]);
        console.log(res);
      }
      Object.assign(
        responseData,
        { quoteData },
        { solscan: `https://solscan.io/tx/${txSig}` }
      );
    }
    console.log(responseData);
    response.send(responseData);
  } catch (error) {
    console.error("Error during token swap:", error);
  }
};

const getInstructions = async (quoteResponse) => {
  try {
    const response = await axios.post(
      "https://quote-api.jup.ag/v6/swap-instructions",
      {
        quoteResponse,
        userPublicKey: wallet.publicKey.toBase58(),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getTokenBalance = async (tokenMintAddress) => {
  try {
    const walletPublicKey = new PublicKey(
      environment.dexSniper.walletPublicKey
    );
    const tokenMintPublicKey = new PublicKey(tokenMintAddress);
    const tokenAccountAddress = await getAssociatedTokenAddress(
      tokenMintPublicKey,
      walletPublicKey
    );

    const tokenAccountInfo = await getAccount(connection, tokenAccountAddress);
    const balance = tokenAccountInfo.amount;
    return { balance };
  } catch (error) {
    console.error("Error fetching token balance:", error);
  }
};

const getPriorityFees = async () => {
  const rpcUrl = "https://api.mainnet-beta.solana.com"; // Replace with the Solana RPC endpoint URL

  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "getRecentPrioritizationFees",
    params: [],
  };

  try {
    const response = await axios.post(rpcUrl, requestBody);

    if (response.data.error) {
      throw new Error(`RPC error: ${JSON.stringify(response.data.error)}`);
    }

    return response.data.result;
  } catch (error) {
    console.error("Error fetching priority fees:", error.message);
    throw error;
  }
};

const calculatePriorityFees = async (prioritizationFeeObjects) => {
  const slots = prioritizationFeeObjects
    .map((feeObject) => feeObject.slot)
    .sort((a, b) => a - b);
  // console.log(slots);

  // Extract slots range
  const slotsRangeStart = slots[0];
  const slotsRangeEnd = slots[slots.length - 1];

  // Calculate the average including zero fees
  const averageFeeIncludingZeros =
    prioritizationFeeObjects.length > 0
      ? Math.floor(
          prioritizationFeeObjects.reduce(
            (acc, feeObject) => acc + feeObject.prioritizationFee,
            0
          ) / prioritizationFeeObjects.length
        )
      : 0;

  // Filter out prioritization fees that are equal to 0 for other calculations
  const nonZeroFees = prioritizationFeeObjects
    .map((feeObject) => feeObject.prioritizationFee)
    .filter((fee) => fee !== 0);

  // Calculate the average of the non-zero fees
  const averageFeeExcludingZeros =
    nonZeroFees.length > 0
      ? Math.floor(
          nonZeroFees.reduce((acc, fee) => acc + fee, 0) / nonZeroFees.length
        )
      : 0;
  // Calculate the median of the non-zero fees
  const sortedFees = nonZeroFees.sort((a, b) => a - b);
  let medianFee = 0;
  if (sortedFees.length > 0) {
    const midIndex = Math.floor(sortedFees.length / 2);
    medianFee =
      sortedFees.length % 2 !== 0
        ? sortedFees[midIndex]
        : Math.floor((sortedFees[midIndex - 1] + sortedFees[midIndex]) / 2);
  }

  // console.log(`Slots examined for priority fees: ${prioritizationFeeObjects.length}`);
  // console.log(`Slots range examined from ${slotsRangeStart} to ${slotsRangeEnd}`);
  // console.log("====================================================================================");

  // // You can use averageFeeIncludingZeros, averageFeeExcludingZeros, and medianFee in your transactions script
  // console.log(` 💰 Average Prioritization Fee (including slots with zero fees): ${averageFeeIncludingZeros} micro-lamports.`);
  // console.log(` 💰 Average Prioritization Fee (excluding slots with zero fees): ${averageFeeExcludingZeros} micro-lamports.`);
  // console.log(` 💰 Median Prioritization Fee (excluding slots with zero fees): ${medianFee} micro-lamports.`);
  return {
    averageFeeExcludingZeros,
    averageFeeIncludingZeros,
    medianFee,
    slotsRangeStart,
    slotsRangeEnd,
  };
};

const geSwapRoute = async (
  inputMint,
  outputMint,
  amount,
  slippageBps = null
) => {
  const params = {
    inputMint,
    outputMint,
    amount,
    slippageBps: slippageBps || 1,
    // priorityFeePerComputeUnit: 25000,
  };
  const response = await axios.get(JUPITER_SWAP_ROUTE_API_URL, { params });
  return response.data;
};

async function snipe(req, res) {
  try {
    const { inputMint, outputMint, amount, side } = req.body;
    swapToken(inputMint, outputMint, amount, res, side === "sell");
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  snipe,
};
