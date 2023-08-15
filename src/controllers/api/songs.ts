import { Response, Request } from "express";
import crypto from 'crypto';
import S3 from "aws-sdk/clients/s3";
import Song from "../../models/song";
import fileSystem from 'fs';

import dotenv from 'dotenv'


dotenv.config();

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY_ID ?? ""
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY ?? ""

const s3 = new S3();

const generateFileName = (bytes = 32) => crypto.randomBytes(bytes).toString('hex')

export const getSongs = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await Song.find().exec());
  } catch (error) {
    res.status(400).json(error);
  };
};

export const getSong = async (req: Request, res: Response): Promise<void> => {
  try {
    res.json(await Song.findById(req.params.id));
  } catch (error) {
    res.status(400).json(error);
  };
};

export const uploadFile = async (fileName: any, fileKey: any) => {
  return new Promise(async function(resolve, reject) {
  const params: any = {
    Bucket: bucketName,
    Key: fileKey,
    Body: fileName[0].buffer,
  };
  
  await s3.upload(params, function(s3Err: any, data: any) {
    if (s3Err){
      reject(s3Err);
    }
      console.log(`File uploaded successfully at ${data.Location}`);
      resolve(data.Location);
    });
  });
};

export const addSong = async (req: Request, res: Response): Promise<void> => {
  // https://stackoverflow.com/questions/56491896/using-multer-and-express-with-typescript
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  let afterSongPeriod = files.audioFile[0].originalname.substr(files.audioFile[0].originalname.indexOf(".") + 1);
  const songFileName = 'noisenebula/songs/' + generateFileName() + '.' + afterSongPeriod;
  let afterArtworkPeriod = files.artwork[0].originalname.substr(files.artwork[0].originalname.indexOf(".") + 1);
  const artworkFileName = 'noisenebula/artwork/' + generateFileName() + '.' +  afterArtworkPeriod;
  console.log(songFileName, artworkFileName);
  const song = {
    title: req.body.title,
    artist: req.body.artist,
    album: req.body.album,
    audioFile: '',
    artwork: '',
    createBy: req.body.createdBy,
  };
  let uploadFilePromises = [];
  uploadFilePromises.push(uploadFile(files.audioFile, songFileName));
  uploadFilePromises.push(uploadFile(files.artwork, artworkFileName));

  Promise.all(uploadFilePromises).then(async (values) => {
    try {
      console.log(values, 'string');
      const post = await Song.create({
        title: req.body.title,
        artist: req.body.artist,
        album: req.body.album,
        audioFile: values[0],
        artwork: values[1],
        createdBy: req.body.createdBy
      });
      res.json(post);
    } catch (error) {
      res.status(400).json(error);
    };
  });
};

export const updateSong = async (req: Request, res: Response): Promise<void> => {
  const songId = req.params.id;
  try {
    res.json(await Song.findByIdAndUpdate(songId, req.body, { new: true }));
  } catch (error) {
    res.status(400).json(error);
  };
};

export const deleteFile = async (fileKey: any) => {
  return new Promise(async function(resolve, reject) {
  const filePath = fileKey.replace('https://noisenebula.s3.amazonaws.com/', '');
  const params: any = {
    Bucket: bucketName,
    Key: filePath,
  };
  
  await s3.deleteObject(params, function(s3Err: any, data: any) {
    if (s3Err){
      reject(s3Err);
    }
      console.log(`File uploaded successfully at ${data.Location}`);
      resolve(data.Location);
    });
  });
};

export const deleteSong = async (req: Request, res: Response): Promise<void> => {
  const song = await Song.findById(req.params.id);
  const filePath = song?.audioFile.replace('https://noisenebula.s3.amazonaws.com/', '');
  const params: any = {
    Bucket: bucketName,
    Key: filePath,
  };
  let uploadFilePromises: any = [];
  uploadFilePromises.push(deleteFile(song?.audioFile))
  uploadFilePromises.push(deleteFile(song?.artwork))

  Promise.all(uploadFilePromises).then(async (values) => {
    try {
      res.json(await Song.findByIdAndRemove(req.params.id));
    } catch (error) {
      res.status(400).json(error);
    };
  });

  s3.deleteObject(params, async function(err: any, data: any){
    if(err){
      console.log('===========================================')
			console.log(err, ' err from aws, either your bucket name is wrong or your keys arent correct');
			console.log('===========================================')
			res.status(400).json({error: 'Error from aws, check your terminal!'})
    }
  });
};