import { RequestHandler, Request } from "express";
import formidable, { Files } from "formidable";

export interface RequestWithFiles extends Request {
  files?: Files;
}

const fileParser: RequestHandler = async (req: RequestWithFiles, res, next) => {
  if (!req.headers["content-type"]?.startsWith("multipart/form-data;"))
    return res.status(422).json({ error: "Only accepts form-data!" });

  const form = formidable({});

  const [fields, files] = await form.parse(req);

  for (let key in fields) {
    const value = fields[key];
    req.body = { ...req.body, [key]: value[0] };
  }

  for (let key in files) {
    const value = files[key];
    req.files = { ...req.files, [key]: value } as formidable.Files;
  }

  next();
};

export default fileParser;
