import { Request, Response } from 'express';
import {
  identifyHardwareWithEvidence,
  imageSearchCatalogue,
  chatWithHardwareGemini,
} from './geminiService';

export async function handleIdentifyHardware(req: Request, res: Response) {
  try {
    const { imagesBase64, description, knownIdentifiers, existingCatalogueSummary } = req.body || {};
    const result = await identifyHardwareWithEvidence({
      imagesBase64,
      description,
      knownIdentifiers,
      existingCatalogueSummary,
    });
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in handleIdentifyHardware:', error);
    return res.status(500).json({
      error: 'Identification service encountered an error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleImageSearch(req: Request, res: Response) {
  try {
    const { imageBase64, existingItems } = req.body || {};
    if (!imageBase64) {
      return res.status(400).json({ error: 'imageBase64 parameter is required' });
    }
    const matches = await imageSearchCatalogue({
      imageBase64,
      existingItems: existingItems || [],
    });
    return res.status(200).json({ matches });
  } catch (error) {
    console.error('Error in handleImageSearch:', error);
    return res.status(500).json({
      error: 'Image search service encountered an error',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function handleHardwareChat(req: Request, res: Response) {
  try {
    const { messages, hardwareContext, model } = req.body || {};
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const result = await chatWithHardwareGemini({
      messages,
      hardwareContext,
      model,
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error in handleHardwareChat:', error);
    const msg = error instanceof Error ? error.message : String(error);
    const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED');

    return res.status(isRateLimit ? 429 : 500).json({
      error: isRateLimit
        ? 'Gemini API quota or rate limit reached. Please wait a few seconds and retry.'
        : 'Hardware chat service encountered an error',
      details: msg,
    });
  }
}
