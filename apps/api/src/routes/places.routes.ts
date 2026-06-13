import { Router } from 'express';
import { autocomplete, details } from '../controllers/places.controller';

const r = Router();
r.get('/autocomplete', autocomplete);
r.get('/details', details);
export default r;
