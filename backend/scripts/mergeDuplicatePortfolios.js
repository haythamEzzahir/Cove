import dns from "dns";
import dotenv from "dotenv";
import mongoose from "mongoose";

import Portfolio from "../models/portfolio.js";
import { mergeDuplicateHoldings } from "../controllers/portfolioController.js";

dns.setDefaultResultOrder("ipv4first");
dotenv.config();

const shouldApply = process.argv.includes("--apply");

// Extract the chart data from the first portfolio that has any
const getMergedChartData = (portfolios) => {
  const portfolioWithChart = portfolios.find((portfolio) => (
    Array.isArray(portfolio.chartData) && portfolio.chartData.length > 0
  ));

  return portfolioWithChart?.chartData || [];
};

// Find and merge all duplicate portfolio documents per user
const main = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI missing");
  }

  await mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 10000
  });

  const duplicateGroups = await Portfolio.aggregate([
    {
      $group: {
        _id: "$userId",
        count: { $sum: 1 },
        portfolioIds: { $push: "$_id" }
      }
    },
    { $match: { count: { $gt: 1 } } }
  ]);

  if (duplicateGroups.length === 0) {
    console.log("No duplicate portfolio documents found.");
    await mongoose.disconnect();
    return;
  }

  for (const group of duplicateGroups) {
    const portfolios = await Portfolio.find({ userId: group._id })
      .sort({ updatedAt: -1, createdAt: -1 });
    const [primaryPortfolio, ...duplicatePortfolios] = portfolios;
    const mergedHoldings = mergeDuplicateHoldings(
      portfolios.flatMap((portfolio) => portfolio.holdings || [])
    );
    const duplicateIds = duplicatePortfolios.map((portfolio) => portfolio._id);

    console.log(
      `userId=${group._id}: ${portfolios.length} portfolios -> 1 portfolio, ${mergedHoldings.length} holdings`
    );

    if (!shouldApply) continue;

    primaryPortfolio.holdings = mergedHoldings;
    primaryPortfolio.chartData = getMergedChartData(portfolios);
    await primaryPortfolio.save();
    await Portfolio.deleteMany({ _id: { $in: duplicateIds } });
  }

  if (shouldApply) {
    await Portfolio.collection.createIndex(
      { userId: 1 },
      { unique: true, name: "userId_1" }
    );
    console.log("Duplicate portfolios merged and unique userId index ensured.");
  } else {
    console.log("Dry run only. Re-run with --apply to merge and delete duplicate portfolio documents.");
  }

  await mongoose.disconnect();
};

main().catch(async (error) => {
  console.error("Merge duplicate portfolios error:", error.message);
  await mongoose.disconnect();
  process.exit(1);
});
