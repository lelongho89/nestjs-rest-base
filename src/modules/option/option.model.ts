/**
 * @file Option model
 * @module module/option/model
*/

import { prop, modelOptions } from '@typegoose/typegoose'
import { Type } from 'class-transformer'
import {
  IsString,
  IsEmail,
  IsOptional,
  IsInt,
  IsObject,
  IsUrl,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  ArrayUnique
} from 'class-validator'
import { KeyValueModel } from '@app/models/key-value.model'
import { getProviderByTypegooseClass } from '@app/transformers/model.transformer'

export const DEFAULT_OPTION: Option = Object.freeze<Option>({
  title: 'REST API',
  sub_title: 'REST API with NESTJS',
  description: 'RESTful API base with NESTJS',
  keywords: [],
  statement: '',
  site_url: 'http://example.com',
  site_email: 'admin@example.com',
  friend_links: [],
  meta: { likes: 0 },
  blocklist: {
    ips: [],
    mails: [],
    keywords: []
  },
  ad_config: ''
})

class AppMeta {
  @IsInt()
  @prop({ default: 0 })
  likes: number
}

// user block list
export class Blocklist {
  @ArrayUnique()
  @IsArray()
  @IsOptional()
  @prop({ type: () => [String], default: [] })
  ips: string[]

  @ArrayUnique()
  @IsArray()
  @IsOptional()
  @prop({ type: () => [String], default: [] })
  mails: string[]

  @ArrayUnique()
  @IsArray()
  @IsOptional()
  @prop({ type: () => [String], default: [] })
  keywords: string[]
}

@modelOptions({
  schemaOptions: {
    versionKey: false,
    timestamps: {
      createdAt: false,
      updatedAt: 'updated_at'
    }
  }
})
export class Option {
  @IsString()
  @IsNotEmpty({ message: 'title?' })
  @prop({ required: true, validate: /\S+/ })
  title: string

  @IsString()
  @IsNotEmpty({ message: 'sub title?' })
  @prop({ required: true, validate: /\S+/ })
  sub_title: string

  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  description: string

  @ArrayUnique()
  @IsArray()
  @IsOptional()
  @prop({ default: [], type: () => [String] })
  keywords: string[]

  @IsUrl({ require_protocol: true })
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  site_url: string

  @IsEmail()
  @IsString()
  @IsNotEmpty()
  @prop({ required: true })
  site_email: string

  @IsString()
  @IsOptional()
  @prop({ default: '' })
  statement: string

  @ArrayUnique()
  @IsArray()
  @prop({ _id: false, default: [], type: () => [KeyValueModel] })
  friend_links: KeyValueModel[]

  // site meta info
  @prop({ _id: false, default: { ...DEFAULT_OPTION.meta } })
  meta: AppMeta

  // site user block list
  @Type(() => Blocklist)
  @ValidateNested()
  @IsObject()
  @IsOptional()
  @prop({ _id: false, default: { ...DEFAULT_OPTION.blocklist } })
  blocklist: Blocklist

  // ad config
  @IsString()
  @IsOptional()
  @prop({ type: String, default: null })
  ad_config: string | null

  @prop({ default: Date.now })
  updated_at?: Date
}

export const OptionProvider = getProviderByTypegooseClass(Option)
