import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (!process.env.ISR_ON_DEMAND_TOKEN) {
    return res
      .status(500)
      .json({
        message: "On-demand Incremental Static Regeneration is not enabled",
      });
  }

  if (req.query.secret !== process.env.ISR_ON_DEMAND_TOKEN) {
    return res.status(401).json({ message: "Invalid token" });
  }

  try {
    await res.revalidate("/blog-pages");
    return res.json({ revalidated: true });
  } catch (err) {
    return res.status(500).send("Error revalidating");
  }
}
