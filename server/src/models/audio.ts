import { categories, categoriesTypes } from "#/utils/audio_category";
import { Model, model, models, ObjectId, Schema } from "mongoose";

export interface AudioDocument {
  title: string;
  about: string;
  owner: ObjectId;
  file: {
    url: string;
    publicId: string;
  };
  poster: {
    url: string;
    publicId: string;
  };
  likes: ObjectId[];
  category: categoriesTypes;
}

const AudioSchema = new Schema<AudioDocument>(
  {
    title: {
      type: String,
      required: true,
    },
    about: {
      type: String,
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    file: {
      type: Object,
      url: String,
      publicId: String,
      required: true,
    },
    poster: {
      type: Object,
      url: String,
      publicId: String,
    },
    likes: [
      {
        type: Schema.Types.ObjectId,
        //ref:"User"表示这些ObjectId引用的是另一个集合(User)中的文档。
        //在MongoDB中，这被称为引用，它允许你在一个集合中的文档中引用另一个集合中的文档。
        ref: "User",
      },
    ],
    category: {
      type: String,
      enum: categories,
      default: "Others",
    },
  },
  {
    timestamps: true,
  }
);

const Audio = models.Audio || model("Audio", AudioSchema);
export default Audio as Model<AudioDocument>;
