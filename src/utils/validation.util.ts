import * as Joi from 'joi';
import {
  SolanaCollectionSnifferProto,
  CommonProto,
} from '@fairyfromalfeya/fsociety-proto';

export const streamUpdatedNftsRequestSchema: Joi.ObjectSchema<SolanaCollectionSnifferProto.StreamUpdatedNftsRequest> =
  Joi.object<SolanaCollectionSnifferProto.StreamUpdatedNftsRequest, true>({
    id: Joi.string().required(),
  });

export const createCollectionRequestSchema: Joi.ObjectSchema<SolanaCollectionSnifferProto.Collection> =
  Joi.object<SolanaCollectionSnifferProto.Collection, true>({
    id: Joi.string().forbidden(),
    name: Joi.string().min(3).max(500).required(),
    address: Joi.string().min(3).max(500).required(),
    floor: Joi.number().min(0).required(),
    createdAt: Joi.string().forbidden(),
    updatedAt: Joi.string().forbidden(),
    removedAt: Joi.string().forbidden(),
  });

export const updateCollectionRequestSchema: Joi.ObjectSchema<SolanaCollectionSnifferProto.Collection> =
  Joi.object<SolanaCollectionSnifferProto.Collection, true>({
    id: Joi.string().uuid({ version: 'uuidv4', separator: '-' }).required(),
    name: Joi.string().min(3).max(500).optional(),
    address: Joi.string().min(3).max(500).optional(),
    floor: Joi.number().min(0).optional(),
    createdAt: Joi.string().forbidden(),
    updatedAt: Joi.string().forbidden(),
    removedAt: Joi.string().forbidden(),
  });

export const removeCollectionRequestSchema: Joi.ObjectSchema<SolanaCollectionSnifferProto.Collection> =
  Joi.object<SolanaCollectionSnifferProto.Collection, true>({
    id: Joi.string().uuid({ version: 'uuidv4', separator: '-' }).required(),
    name: Joi.string().forbidden(),
    address: Joi.string().forbidden(),
    floor: Joi.number().forbidden(),
    createdAt: Joi.string().forbidden(),
    updatedAt: Joi.string().forbidden(),
    removedAt: Joi.string().forbidden(),
  });

const orderBySchema: Joi.StringSchema = Joi.string()
  .default('updatedAt')
  .regex(/^(updatedAt|createdAt)$/);

const orderDirectionSchema: Joi.NumberSchema = Joi.number()
  .default(2)
  .min(1)
  .max(Object.keys(CommonProto.OrderDirection).length - 1);

export const paginationRequestSchema: Joi.ObjectSchema<CommonProto.PaginationRequest> =
  Joi.object<CommonProto.PaginationRequest, true>({
    user: Joi.string().uuid({ version: 'uuidv4', separator: '-' }).optional(),
    pageSize: Joi.number().default(20).min(1).max(100),
    pageNumber: Joi.number().default(0).min(0),
    orderBy: orderBySchema.optional(),
    orderDirection: orderDirectionSchema.optional(),
    filters: Joi.object().pattern(/.*/, [
      Joi.string().allow(''),
      Joi.number(),
      Joi.boolean(),
    ]),
  });
