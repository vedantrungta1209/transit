import { Request, Response } from 'express';
import { placesAutocomplete, placeDetails } from '../services/maps.service';
import { success, error } from '../utils/response';

export async function autocomplete(req: Request, res: Response) {
  const { input, lat, lng } = req.query as any;
  if (!input || input.length < 2) return success(res, { predictions: [] });
  const predictions = await placesAutocomplete(input, lat ? Number(lat) : undefined, lng ? Number(lng) : undefined);
  success(res, { predictions, status: predictions.length > 0 ? 'OK' : 'ZERO_RESULTS' });
}

export async function details(req: Request, res: Response) {
  const { place_id } = req.query as any;
  if (!place_id) return error(res, 'place_id required', 400);
  const result = await placeDetails(place_id);
  if (!result) return error(res, 'Place not found', 404);
  success(res, result);
}
