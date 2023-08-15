import jwt, { Secret } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import UserModel from '../../models/user';
import { Request, Response } from "express";

export const create = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.create(req.body)
    const token = createJWT(user);
    res.json(token);
  } catch (error) {
    res.status(400).json(error);
  };
};

export const login = async (req: Request, res: Response) => {
  try {
    const user = await UserModel.findOne({ email: req.body.email });
    if (!user) throw new Error();
    const match = await bcrypt.compare(req.body.password, user.password);
    if (!match) throw new Error();
    const token = createJWT(user);
    res.json(token);
  } catch (error) {
    res.status(400).json('Bad Credentials');
  };
};

/*--- Helper Functions --*/

const SECRET: Secret = `${process.env.SECRET}`

const createJWT = (user: any) => {
  return jwt.sign(
    // data payload
    { user },
    SECRET,
    { expiresIn: '24h' }
  );
};