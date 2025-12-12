import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type FactDocument = Fact & Document;

@Schema()
export class Fact {
  @Prop({ required: true, unique: true, index: true })
  externalId: string;

  @Prop({ required: true })
  text: string;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  sourceUrl: string;

  @Prop({ required: true, index: true })
  language: string;

  @Prop({ required: true })
  permalink: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const FactSchema = SchemaFactory.createForClass(Fact);
