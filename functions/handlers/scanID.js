const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const vision = require("@google-cloud/vision");
const cors = require("cors")({ origin: true });

const client = new vision.ImageAnnotatorClient();

const extractDataFromText = (text) => {
  const lines = text.split("\n");
  return {
    firstName: lines[0] || "",
    lastName: lines[1] || "",
    idNumber: lines.find((l) => l.includes("ID")) || "",
    dateOfBirth: lines.find((l) => /\d{2}\/\d{2}\/\d{4}/.test(l)) || "",
    gender: lines.find((l) => /(Male|Female)/i.test(l)) || "",
  };
};

exports.scanID = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      const { imageUrl } = req.body;

      if (!imageUrl) {
        return res.status(400).json({ success: false, message: "Image URL is required." });
      }

      const [result] = await client.textDetection(imageUrl);
      const text = result.fullTextAnnotation?.text || "";

      const data = extractDataFromText(text);
      res.json({ success: true, data });

    } catch (error) {
      logger.error("Vision API error:", error);
      res.status(500).json({ success: false, message: "OCR failed." });
    }
  });
});
