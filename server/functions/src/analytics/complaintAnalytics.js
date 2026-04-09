import express from 'express';
import mongoose from 'mongoose';

const router = express.Router();

// Basic Complaint Schema for Analytics matching the new structure
const complaintSchema = new mongoose.Schema({
  category: { type: String, required: true },
  status: { type: String, enum: ['resolved', 'pending'], default: 'pending' },
  hostelId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hostel' },
  blockId: { type: mongoose.Schema.Types.ObjectId, ref: 'Block' },
}, { timestamps: true });

// Prevent model overwrite in development
const Complaint = mongoose.models.Complaint || mongoose.model('Complaint', complaintSchema);


/**
 * GET /api/analytics/complaints
 * Fetches complaint analytics for the last X days, grouped by category.
 * Query Params:
 * - role: 'management' | 'warden'
 * - hostelId: string (required if role is warden)
 * - days: number (default 7)
 */
router.get('/complaints', async (req, res) => {
  try {
    const { role, hostelId, days = 7 } = req.query;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    // Base match condition
    const matchCondition = {
      createdAt: { $gte: startDate }
    };

    // Role based filtering
    if (role === 'warden') {
      if (!hostelId) {
        return res.status(400).json({ error: "hostelId is required for warden role" });
      }
      matchCondition.hostelId = new mongoose.Types.ObjectId(hostelId);
    }
    // Management role sees all hostels, so no hostel filtering applies

    const aggregationPipeline = [
      { $match: matchCondition },
      { 
        $group: { 
          _id: "$category", 
          count: { $sum: 1 } 
        } 
      },
      { 
        $project: { 
          _id: 0, 
          category: "$_id", 
          count: 1 
        } 
      },
      { $sort: { count: -1 } }
    ];

    const categoryBreakdown = await Complaint.aggregate(aggregationPipeline);
    const totalComplaints = categoryBreakdown.reduce((sum, item) => sum + item.count, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalComplaints,
        categoryBreakdown
      }
    });

  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
