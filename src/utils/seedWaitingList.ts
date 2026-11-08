import { createSelectionCampaign, createCandidate } from "../db/selectionRepository";
import cyuveData from "../data/cyuveWaitingList.json";

export const seedCyuveWaitingList = async () => {
  try {
    // 1. Create the Campaign
    const campaign = await createSelectionCampaign({
      title: "URUTONDE RW'IMIRYANGO IZOROZWA MURI GAHUNDA YA GIRINKA MU MURYANGO WA 2026-2027",
      year: "2026-2027",
      district: "MUSANZE",
      sector: "CYUVE",
      status: "OPEN"
    });

    console.log("Campaign created:", campaign.id);

    // 2. Add all candidates
    for (const item of cyuveData) {
      await createCandidate({
        campaignId: campaign.id,
        fullName: item.name,
        nationalId: item.id,
        sex: item.sex as "M" | "F",
        phone: "",
        ubudeheCategory: "1", // Default to 1 as per general Girinka guidelines if not specified
        district: "MUSANZE",
        sector: item.sector,
        cell: item.cell,
        village: item.village,
        drawNumber: item.draw.toString(),
        conclusion: "APPROVED", // Mark as approved to show in Waiting List
        graduationStatus: "APPROVED"
      });
      console.log("Added candidate:", item.name);
    }

    return true;
  } catch (error) {
    console.error("Seeding error:", error);
    return false;
  }
};
