import { Request, Response } from "express";
import { listingRepository } from "../repositories/listingRepository";
import { userRepository } from "../repositories/userRepository";

export const listingController = {
  getAll: async (_req: Request, res: Response) => {
    const listings = await listingRepository.getAll();
    res.json(listings);
  },

  getById: async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const listing = await listingRepository.getById(id);

    if (!listing) {
      return res.status(404).json({ error: "Listing not found" });
    }

    return res.json(listing);
  },

  create: async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const user = await userRepository.findByFirebaseUid(firebaseUid);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const newListing = await listingRepository.create({
        ...req.body,
        user_id: user.id
      });
      return res.status(201).json({
        message: "Listing created succesfully",
        listing: newListing});

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error creating listing" });
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const firebaseUid = (req as any).user.uid;
      const user = await userRepository.findByFirebaseUid(firebaseUid);
      
      const id = Number(req.params.id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const listing = await listingRepository.getById(id);

      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.user_id !== user.id) {
        return res.status(403).json({ error: "Unauthorized to update this listing" }); 
      }

      const updated = await listingRepository.update(id, req.body);
      return res.json(updated);

    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error updating listing" });
    }
  },

  delete: async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);

      const firebaseUid = (req as any).user.uid;
      const user = await userRepository.findByFirebaseUid(firebaseUid);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      const listing = await listingRepository.getById(id);
      if (!listing) {
        return res.status(404).json({ error: "Listing not found" });
      }

      if (listing.user_id !== user.id) {
        return res.status(403).json({ error: "Unauthorized to delete this listing" }); 
      }

      const deleted = await listingRepository.delete(id);
      return res.json({ message: "Listing deleted successfully" });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: "Error deleting listing" });
    }
  }
};
