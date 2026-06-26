import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';

// We define our Mongoose schema first as requested
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, required: false },
  profilePhoto: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face' 
  },
  coverPhoto: { 
    type: String, 
    default: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80' 
  },
  bio: { type: String, default: 'Hey there! I am using Jolshaa.' },
  dateOfBirth: { type: String, required: false },
  gender: { type: String, required: false },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', default: [] }],
  isAdmin: { type: Boolean, default: false },
  suspended: { type: Boolean, default: false },
  privacySettings: {
    defaultPostVisibility: { type: String, enum: ['public', 'friends', 'onlyme'], default: 'public' },
    friendRequestSender: { type: String, enum: ['everyone', 'friends_of_friends'], default: 'everyone' },
    friendsListVisibility: { type: String, enum: ['everyone', 'friends', 'onlyme'], default: 'everyone' }
  },
  createdAt: { type: Date, default: Date.now }
});

// Hash password before saving to real MongoDB if we use mongoose
UserSchema.pre('save', async function(this: any, next: any) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Password verification helper on model
UserSchema.methods.comparePassword = async function(this: any, candidatePassword: string): Promise<boolean> {
  return bcryptjs.compare(candidatePassword, this.password);
};

export const UserModel = (mongoose.models.User || mongoose.model('User', UserSchema)) as any;

// Post Schema
const PostSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  media: [{ type: String }],
  feeling: { type: String },
  taggedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  visibility: { type: String, enum: ['public', 'friends', 'onlyme'], default: 'public' },
  reactions: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['like', 'love', 'haha', 'wow', 'sad', 'angry'], required: true }
  }],
  postedIn: {
    type: { type: String, enum: ['profile', 'group', 'page'], default: 'profile' },
    refId: { type: mongoose.Schema.Types.ObjectId }
  },
  isEdited: { type: Boolean, default: false }
}, { timestamps: true });

// Comment Schema
const CommentSchema = new mongoose.Schema({
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  parentComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }
}, { timestamps: true });

export const PostModel = (mongoose.models.Post || mongoose.model('Post', PostSchema)) as any;
export const CommentModel = (mongoose.models.Comment || mongoose.model('Comment', CommentSchema)) as any;

// FriendRequest Schema
const FriendRequestSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending', required: true }
}, { timestamps: true });

export const FriendRequestModel = (mongoose.models.FriendRequest || mongoose.model('FriendRequest', FriendRequestSchema)) as any;

// Conversation Schema
const ConversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isGroup: { type: Boolean, default: false },
  groupName: { type: String, required: false },
}, { timestamps: true });

// Message Schema
const MessageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: false },
  media: { type: String, required: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Notification Schema
const NotificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: ['friend_request', 'comment', 'reaction', 'tag', 'message', 'group_invite'], 
    required: true 
  },
  relatedPost: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: false },
  relatedComment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', required: false },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

// Group Schema
const GroupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  coverPhoto: { type: String, required: false },
  privacy: { type: String, enum: ['public', 'private'], default: 'public' },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  pendingRequests: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Page Schema
const PageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: false },
  profilePhoto: { type: String, required: false },
  coverPhoto: { type: String, required: false },
  category: { type: String, required: false },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  admins: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Story Schema
const StorySchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  media: { type: String, required: true },
  mediaType: { type: String, enum: ['image', 'video'], default: 'image' },
  viewers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

// Create TTL index on expiresAt. Documents will automatically be deleted by MongoDB when expiresAt is reached.
StorySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Album Schema
const AlbumSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  photos: [{ type: String }],
}, { timestamps: true });

// Set up MongoDB Text Indexes for Search
UserSchema.index({ name: 'text', bio: 'text' });
PostSchema.index({ text: 'text' });
GroupSchema.index({ name: 'text', description: 'text' });
PageSchema.index({ name: 'text', description: 'text' });

// Report Schema
const ReportSchema = new mongoose.Schema({
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['post', 'comment', 'user'], required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
}, { timestamps: true });

export const ConversationModel = (mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema)) as any;
export const MessageModel = (mongoose.models.Message || mongoose.model('Message', MessageSchema)) as any;
export const NotificationModel = (mongoose.models.Notification || mongoose.model('Notification', NotificationSchema)) as any;
export const GroupModel = (mongoose.models.Group || mongoose.model('Group', GroupSchema)) as any;
export const PageModel = (mongoose.models.Page || mongoose.model('Page', PageSchema)) as any;
export const StoryModel = (mongoose.models.Story || mongoose.model('Story', StorySchema)) as any;
export const AlbumModel = (mongoose.models.Album || mongoose.model('Album', AlbumSchema)) as any;
export const ReportModel = (mongoose.models.Report || mongoose.model('Report', ReportSchema)) as any;

// ---- DATABASE SERVICE LAYER ----
// Supports BOTH real MongoDB connection AND a fully operational in-memory fallback
// This ensures the application works immediately in the preview environment, 
// even before the user configures their MongoDB URI!

let isConnectedToMongo = false;

// Attempt to connect to MongoDB
export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || mongoUri.includes('username:password')) {
    console.warn('⚠️ MONGODB_URI not configured or contains placeholder credentials. Running with high-fidelity In-Memory Database Fallback.');
    isConnectedToMongo = false;
    return;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    isConnectedToMongo = true;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error: any) {
    console.log('ℹ️ Note: MONGODB_URI is configured but connection could not be established (likely due to network restrictions or IP whitelisting). Continuing with In-Memory Database Fallback. Connection details:', error?.message || error);
    isConnectedToMongo = false;
  }
}

// In-Memory Database Store for robust fallback
const inMemoryUsers: Map<string, any> = new Map();
const inMemoryPosts: any[] = [];
const inMemoryComments: any[] = [];
const inMemoryFriendRequests: any[] = [];
const inMemoryConversations: any[] = [];
const inMemoryMessages: any[] = [];
const inMemoryNotifications: any[] = [];
const inMemoryGroups: any[] = [];
const inMemoryPages: any[] = [];
const inMemoryStories: any[] = [];
const inMemoryAlbums: any[] = [];
const inMemoryReports: any[] = [];

// Seed a default user for testing if memory store is empty
const seedDefaultUser = async () => {
  const hashedPass = await bcryptjs.hash('Password123!', 10);
  const defaultUser = {
    id: 'demo-user-123',
    _id: 'demo-user-123',
    name: 'Demo User',
    email: 'demo@jolshaa.com',
    password: hashedPass,
    phone: '+1234567890',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    coverPhoto: 'https://images.unsplash.com/photo-1707343843437-caacff5cfa74?w=1200&auto=format&fit=crop&q=80',
    bio: 'Welcome to Jolshaa! I am the default demo user. You can edit my profile or sign up as a new user.',
    dateOfBirth: '1995-05-15',
    gender: 'Female',
    friends: [],
    blockedUsers: [],
    isAdmin: true,
    suspended: false,
    privacySettings: {
      defaultPostVisibility: 'public',
      friendRequestSender: 'everyone',
      friendsListVisibility: 'everyone'
    },
    createdAt: new Date().toISOString()
  };
  inMemoryUsers.set(defaultUser.email, defaultUser);

  // Seed default posts
  const post1 = {
    id: 'post-1',
    _id: 'post-1',
    author: 'demo-user-123',
    text: 'Hello everyone! 🌟 Welcome to Jolshaa Phase 2. We now have fully operational Social Feed with reactions, nested comment replies, and custom visibility! Let me know what you think.',
    media: ['https://images.unsplash.com/photo-1501504905252-473c47e087f8?w=800&auto=format&fit=crop&q=80'],
    feeling: 'excited',
    taggedUsers: [],
    visibility: 'public',
    reactions: [
      { user: 'demo-user-123', type: 'love' }
    ],
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    updatedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  };

  const post2 = {
    id: 'post-2',
    _id: 'post-2',
    author: 'demo-user-123',
    text: 'Spent the evening watching the sunset. There is something extremely therapeutic about chasing light. 🌅✨',
    media: ['https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=800&auto=format&fit=crop&q=80'],
    feeling: 'peaceful',
    taggedUsers: [],
    visibility: 'public',
    reactions: [],
    isEdited: false,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 3600000 * 24).toISOString()
  };

  inMemoryPosts.push(post1, post2);

  // Seed some comments
  inMemoryComments.push({
    id: 'comment-1',
    _id: 'comment-1',
    post: 'post-1',
    author: 'demo-user-123',
    text: 'First comment on Phase 2! Really loving the clean new pink styling!',
    createdAt: new Date(Date.now() - 3600000 * 1.5).toISOString()
  });
};

seedDefaultUser();

// Helper to sanitize database output (remove password, map _id to id)
function formatUser(userDoc: any): any {
  if (!userDoc) return null;
  const raw = userDoc.toObject ? userDoc.toObject() : { ...userDoc };
  const id = raw._id ? raw._id.toString() : raw.id;
  delete raw.password;
  delete raw.__v;
  return {
    ...raw,
    id,
    friends: (raw.friends || []).map((f: any) => f._id ? f._id.toString() : f.toString()),
    blockedUsers: (raw.blockedUsers || []).map((b: any) => b._id ? b._id.toString() : b.toString()),
    createdAt: raw.createdAt instanceof Date ? raw.createdAt.toISOString() : raw.createdAt
  };
}

export const dbService = {
  isUsingMongo: () => isConnectedToMongo,

  async findUserByEmail(email: string) {
    const cleanedEmail = email.toLowerCase().trim();
    if (isConnectedToMongo) {
      return await UserModel.findOne({ email: cleanedEmail });
    } else {
      return inMemoryUsers.get(cleanedEmail) || null;
    }
  },

  async findUserById(id: string) {
    if (isConnectedToMongo) {
      const user = await UserModel.findById(id);
      return formatUser(user);
    } else {
      for (const user of inMemoryUsers.values()) {
        if (user.id === id || user._id === id) {
          return formatUser(user);
        }
      }
      return null;
    }
  },

  async createUser(userData: any) {
    const cleanedEmail = userData.email.toLowerCase().trim();
    
    if (isConnectedToMongo) {
      const newUser = new UserModel({
        name: userData.name,
        email: cleanedEmail,
        password: userData.password, // Schema hook pre-save will hash this
        phone: userData.phone,
        profilePhoto: userData.profilePhoto,
        coverPhoto: userData.coverPhoto,
        bio: userData.bio,
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender
      });
      const savedUser = await newUser.save();
      return formatUser(savedUser);
    } else {
      const hashedPassword = await bcryptjs.hash(userData.password, 10);
      const id = 'user-' + Math.random().toString(36).substr(2, 9);
      const newUser = {
        id,
        _id: id,
        name: userData.name,
        email: cleanedEmail,
        password: hashedPassword,
        phone: userData.phone,
        profilePhoto: userData.profilePhoto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        coverPhoto: userData.coverPhoto || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200&auto=format&fit=crop&q=80',
        bio: userData.bio || 'Hey there! I am using Jolshaa.',
        dateOfBirth: userData.dateOfBirth,
        gender: userData.gender,
        friends: [],
        blockedUsers: [],
        createdAt: new Date().toISOString()
      };
      inMemoryUsers.set(cleanedEmail, newUser);
      return formatUser(newUser);
    }
  },

  async verifyPassword(userDoc: any, candidatePassword: string): Promise<boolean> {
    if (isConnectedToMongo && userDoc.comparePassword) {
      return await userDoc.comparePassword(candidatePassword);
    } else {
      return await bcryptjs.compare(candidatePassword, userDoc.password);
    }
  },

  async updateUser(id: string, updateData: any) {
    if (isConnectedToMongo) {
      const updatedUser = await UserModel.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      );
      return formatUser(updatedUser);
    } else {
      let foundUser: any = null;
      let userKey: string | null = null;
      
      for (const [key, user] of inMemoryUsers.entries()) {
        if (user.id === id || user._id === id) {
          foundUser = user;
          userKey = key;
          break;
        }
      }

      if (!foundUser || !userKey) return null;

      const updated = {
        ...foundUser,
        ...updateData,
        // Ensure keys that shouldn't change are preserved
        id: foundUser.id,
        _id: foundUser._id,
        email: foundUser.email,
        password: foundUser.password,
        createdAt: foundUser.createdAt
      };

      inMemoryUsers.set(userKey, updated);
      return formatUser(updated);
    }
  },

  async getAllUsers() {
    if (isConnectedToMongo) {
      const users = await UserModel.find({});
      return users.map(u => formatUser(u));
    } else {
      return Array.from(inMemoryUsers.values()).map(u => formatUser(u));
    }
  },

  async createPost(postData: any) {
    if (isConnectedToMongo) {
      const post = new PostModel({
        author: postData.author,
        text: postData.text,
        media: postData.media || [],
        feeling: postData.feeling,
        taggedUsers: postData.taggedUsers || [],
        visibility: postData.visibility || 'public',
        reactions: [],
        postedIn: postData.postedIn || { type: 'profile', refId: null },
        isEdited: false
      });
      const saved = await post.save();
      const populated = await PostModel.findById(saved._id).populate('author').populate('taggedUsers');
      return populated;
    } else {
      const id = 'post-' + Math.random().toString(36).substr(2, 9);
      const newPost = {
        id,
        _id: id,
        author: postData.author,
        text: postData.text,
        media: postData.media || [],
        feeling: postData.feeling,
        taggedUsers: postData.taggedUsers || [],
        visibility: postData.visibility || 'public',
        reactions: [],
        postedIn: postData.postedIn || { type: 'profile', refId: null },
        isEdited: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryPosts.unshift(newPost); // Unshift so it appears on top of the feed!
      
      // Let's populate and format for return
      return await this.formatPostObj(newPost);
    }
  },

  async formatPostObj(post: any) {
    const authorObj = await this.findUserById(post.author.toString());
    const populatedTagged = await Promise.all(
      (post.taggedUsers || []).map(async (uId: string) => await this.findUserById(uId.toString()))
    );
    const populatedReactions = await Promise.all(
      (post.reactions || []).map(async (r: any) => ({
        user: await this.findUserById(r.user.toString()),
        type: r.type
      }))
    );
    const commentCount = isConnectedToMongo
      ? await CommentModel.countDocuments({ post: post._id })
      : inMemoryComments.filter(c => c.post === post.id).length;

    return {
      ...post,
      id: post._id ? post._id.toString() : post.id,
      author: authorObj,
      taggedUsers: populatedTagged.filter(Boolean),
      reactions: populatedReactions.filter(r => r.user),
      commentCount,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    };
  },

  async getFeedPosts(userId: string, limit: number = 10, skip: number = 0) {
    if (isConnectedToMongo) {
      // Get current user doc to know who their friends and blocked users are
      const userDoc = await UserModel.findById(userId);
      const friends = userDoc?.friends || [];
      const blockedUsers = userDoc?.blockedUsers || [];
      
      // Find all users who have blocked current user
      const usersWhoBlockedMe = await UserModel.find({ blockedUsers: userId }, '_id');
      const blockedMeIds = usersWhoBlockedMe.map(u => u._id.toString());
      const allBlockedIds = [...blockedUsers.map(id => id.toString()), ...blockedMeIds];

      const query = {
        author: { $nin: allBlockedIds },
        $or: [
          { author: userId },
          { visibility: 'public' },
          { visibility: 'friends', author: { $in: friends } }
        ]
      };
      
      const posts = await PostModel.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author')
        .populate('taggedUsers')
        .populate('reactions.user');
        
      const postsWithCommentCount = await Promise.all(
        posts.map(async (post: any) => {
          const commentCount = await CommentModel.countDocuments({ post: post._id });
          const plain = post.toObject ? post.toObject() : post;
          // Format all IDs
          const plainPost = {
            ...plain,
            id: plain._id.toString(),
            author: formatUser(plain.author),
            taggedUsers: (plain.taggedUsers || []).map((tu: any) => formatUser(tu)),
            reactions: (plain.reactions || []).map((r: any) => ({
              ...r,
              user: formatUser(r.user)
            })).filter((r: any) => r.user),
            commentCount
          };
          return plainPost;
        })
      );
      
      return postsWithCommentCount;
    } else {
      // In-Memory: Filter out 'onlyme' visibility posts, filter by friends, and handle blocks
      const currentUser = await this.findUserById(userId);
      const friends = currentUser?.friends || [];
      const blockedUsers = currentUser?.blockedUsers || [];
      
      // Find users who blocked the current user
      const blockedMeIds: string[] = [];
      for (const u of inMemoryUsers.values()) {
        const uBlocked = u.blockedUsers || [];
        if (uBlocked.includes(userId)) {
          blockedMeIds.push(u.id || u._id);
        }
      }
      const allBlockedIds = [...blockedUsers, ...blockedMeIds];

      const filtered = inMemoryPosts.filter(post => {
        const authorId = post.author.toString();
        
        // Filter out if user is blocked or blocked us
        if (allBlockedIds.includes(authorId)) return false;
        
        // Own posts always visible
        if (authorId === userId) return true;
        
        // Only me visibility
        if (post.visibility === 'onlyme') return false;
        
        // Public posts
        if (post.visibility === 'public') return true;
        
        // Friends visibility
        if (post.visibility === 'friends') {
          return friends.includes(authorId);
        }
        
        return false;
      });

      // Sort by createdAt desc
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Paginate
      const paginated = filtered.slice(skip, skip + limit);
      
      // Populate
      return await Promise.all(paginated.map(p => this.formatPostObj(p)));
    }
  },

  async getGroupPosts(groupId: string, userId: string, limit: number = 10, skip: number = 0) {
    if (isConnectedToMongo) {
      // Basic check - we assume the route handler checks group membership for private groups
      const posts = await PostModel.find({ 'postedIn.type': 'group', 'postedIn.refId': groupId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author')
        .populate('taggedUsers')
        .populate('reactions.user');
        
      const postsWithCommentCount = await Promise.all(
        posts.map(async (post: any) => {
          const commentCount = await CommentModel.countDocuments({ post: post._id });
          const plain = post.toObject ? post.toObject() : post;
          const plainPost = {
            ...plain,
            id: plain._id.toString(),
            author: formatUser(plain.author),
            taggedUsers: (plain.taggedUsers || []).map((tu: any) => formatUser(tu)),
            reactions: (plain.reactions || []).map((r: any) => ({
              ...r,
              user: formatUser(r.user)
            })).filter((r: any) => r.user),
            commentCount
          };
          return plainPost;
        })
      );
      return postsWithCommentCount;
    } else {
      const filtered = inMemoryPosts.filter(post => 
        post.postedIn && post.postedIn.type === 'group' && post.postedIn.refId === groupId
      );
      const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const paginated = sorted.slice(skip, skip + limit);
      
      return await Promise.all(
        paginated.map(async post => await this.formatPostObj(post))
      );
    }
  },

  async getPagePosts(pageId: string, limit: number = 10, skip: number = 0) {
    if (isConnectedToMongo) {
      const posts = await PostModel.find({ 'postedIn.type': 'page', 'postedIn.refId': pageId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author')
        .populate('taggedUsers')
        .populate('reactions.user');
        
      const postsWithCommentCount = await Promise.all(
        posts.map(async (post: any) => {
          const commentCount = await CommentModel.countDocuments({ post: post._id });
          const plain = post.toObject ? post.toObject() : post;
          const plainPost = {
            ...plain,
            id: plain._id.toString(),
            author: formatUser(plain.author),
            taggedUsers: (plain.taggedUsers || []).map((tu: any) => formatUser(tu)),
            reactions: (plain.reactions || []).map((r: any) => ({
              ...r,
              user: formatUser(r.user)
            })).filter((r: any) => r.user),
            commentCount
          };
          return plainPost;
        })
      );
      return postsWithCommentCount;
    } else {
      const filtered = inMemoryPosts.filter(post => 
        post.postedIn && post.postedIn.type === 'page' && post.postedIn.refId === pageId
      );
      const sorted = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const paginated = sorted.slice(skip, skip + limit);
      
      return await Promise.all(
        paginated.map(async post => await this.formatPostObj(post))
      );
    }
  },

  async editPost(postId: string, userId: string, updateData: any) {
    if (isConnectedToMongo) {
      const post = await PostModel.findById(postId);
      if (!post) return null;
      if (post.author.toString() !== userId) {
        throw new Error('Unauthorized to edit this post');
      }
      
      // Perform updates
      if (updateData.text !== undefined) post.text = updateData.text;
      if (updateData.media !== undefined) post.media = updateData.media;
      if (updateData.feeling !== undefined) post.feeling = updateData.feeling;
      if (updateData.taggedUsers !== undefined) post.taggedUsers = updateData.taggedUsers;
      if (updateData.visibility !== undefined) post.visibility = updateData.visibility;
      post.isEdited = true;
      
      const saved = await post.save();
      const populated = await PostModel.findById(saved._id).populate('author').populate('taggedUsers').populate('reactions.user');
      
      const plain = populated.toObject ? populated.toObject() : populated;
      const commentCount = await CommentModel.countDocuments({ post: saved._id });
      return {
        ...plain,
        id: plain._id.toString(),
        author: formatUser(plain.author),
        taggedUsers: (plain.taggedUsers || []).map((tu: any) => formatUser(tu)),
        reactions: (plain.reactions || []).map((r: any) => ({
          ...r,
          user: formatUser(r.user)
        })).filter((r: any) => r.user),
        commentCount
      };
    } else {
      const postIndex = inMemoryPosts.findIndex(p => p.id === postId || p._id === postId);
      if (postIndex === -1) return null;
      const post = inMemoryPosts[postIndex];
      if (post.author !== userId) {
        throw new Error('Unauthorized to edit this post');
      }

      const updated = {
        ...post,
        ...updateData,
        isEdited: true,
        updatedAt: new Date().toISOString()
      };
      
      inMemoryPosts[postIndex] = updated;
      return await this.formatPostObj(updated);
    }
  },

  async deletePost(postId: string, userId: string) {
    if (isConnectedToMongo) {
      const post = await PostModel.findById(postId);
      if (!post) return false;
      if (post.author.toString() !== userId) {
        throw new Error('Unauthorized to delete this post');
      }
      await PostModel.deleteOne({ _id: postId });
      // Delete post comments
      await CommentModel.deleteMany({ post: postId });
      return true;
    } else {
      const postIndex = inMemoryPosts.findIndex(p => p.id === postId || p._id === postId);
      if (postIndex === -1) return false;
      const post = inMemoryPosts[postIndex];
      if (post.author !== userId) {
        throw new Error('Unauthorized to delete this post');
      }
      inMemoryPosts.splice(postIndex, 1);
      // Delete post comments
      for (let i = inMemoryComments.length - 1; i >= 0; i--) {
        if (inMemoryComments[i].post === postId) {
          inMemoryComments.splice(i, 1);
        }
      }
      return true;
    }
  },

  async reactToPost(postId: string, userId: string, reactionType: string | null) {
    if (isConnectedToMongo) {
      const post = await PostModel.findById(postId);
      if (!post) return null;
      
      // Remove existing reaction if any
      post.reactions = post.reactions.filter((r: any) => r.user.toString() !== userId);
      
      // Add new reaction if type provided
      if (reactionType) {
        post.reactions.push({ user: userId, type: reactionType });
      }
      
      await post.save();
      const populated = await PostModel.findById(postId).populate('author').populate('taggedUsers').populate('reactions.user');
      
      // Format
      const plain = populated.toObject ? populated.toObject() : populated;
      const commentCount = await CommentModel.countDocuments({ post: postId });
      return {
        ...plain,
        id: plain._id.toString(),
        author: formatUser(plain.author),
        taggedUsers: (plain.taggedUsers || []).map((tu: any) => formatUser(tu)),
        reactions: (plain.reactions || []).map((r: any) => ({
          ...r,
          user: formatUser(r.user)
        })).filter((r: any) => r.user),
        commentCount
      };
    } else {
      const postIndex = inMemoryPosts.findIndex(p => p.id === postId || p._id === postId);
      if (postIndex === -1) return null;
      const post = inMemoryPosts[postIndex];
      
      // Remove user reaction
      post.reactions = (post.reactions || []).filter((r: any) => r.user !== userId);
      
      // Add if type is not null
      if (reactionType) {
        post.reactions.push({ user: userId, type: reactionType });
      }
      
      inMemoryPosts[postIndex] = post;
      return await this.formatPostObj(post);
    }
  },

  async addComment(postId: string, userId: string, text: string, parentCommentId?: string) {
    if (isConnectedToMongo) {
      const comment = new CommentModel({
        post: postId,
        author: userId,
        text,
        parentComment: parentCommentId || null
      });
      const saved = await comment.save();
      const populated = await CommentModel.findById(saved._id).populate('author');
      
      const plain = populated.toObject ? populated.toObject() : populated;
      return {
        ...plain,
        id: plain._id.toString(),
        author: formatUser(plain.author)
      };
    } else {
      const id = 'comment-' + Math.random().toString(36).substr(2, 9);
      const newComment = {
        id,
        _id: id,
        post: postId,
        author: userId,
        text,
        parentComment: parentCommentId || null,
        createdAt: new Date().toISOString()
      };
      inMemoryComments.push(newComment);
      
      // Populate author
      const authorObj = await this.findUserById(userId);
      return {
        ...newComment,
        author: authorObj
      };
    }
  },

  async getPostComments(postId: string, limit: number = 50, skip: number = 0) {
    if (isConnectedToMongo) {
      const comments = await CommentModel.find({ post: postId })
        .sort({ createdAt: 1 })
        .populate('author');
        
      const formatted = comments.map((c: any) => {
        const plain = c.toObject ? c.toObject() : c;
        return {
          ...plain,
          id: plain._id.toString(),
          author: formatUser(plain.author),
          parentComment: plain.parentComment ? plain.parentComment.toString() : null
        };
      });
      
      return formatted;
    } else {
      const comments = inMemoryComments.filter(c => c.post === postId);
      // Sort chronologically
      comments.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      
      const formatted = await Promise.all(
        comments.map(async (c) => {
          const authorObj = await this.findUserById(c.author);
          return {
            ...c,
            author: authorObj,
            id: c._id ? c._id.toString() : c.id,
            parentComment: c.parentComment ? c.parentComment.toString() : null
          };
        })
      );
      
      return formatted;
    }
  },

  async deleteComment(commentId: string, userId: string) {
    if (isConnectedToMongo) {
      const comment = await CommentModel.findById(commentId);
      if (!comment) return false;
      if (comment.author.toString() !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }
      await CommentModel.deleteOne({ _id: commentId });
      // Delete any child comments recursively or just orphans
      await CommentModel.deleteMany({ parentComment: commentId });
      return true;
    } else {
      const commentIndex = inMemoryComments.findIndex(c => c.id === commentId || c._id === commentId);
      if (commentIndex === -1) return false;
      const comment = inMemoryComments[commentIndex];
      if (comment.author !== userId) {
        throw new Error('Unauthorized to delete this comment');
      }
      inMemoryComments.splice(commentIndex, 1);
      // Delete any replies
      for (let i = inMemoryComments.length - 1; i >= 0; i--) {
        if (inMemoryComments[i].parentComment === commentId) {
          inMemoryComments.splice(i, 1);
        }
      }
      return true;
    }
  },

  async sendFriendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    if (isConnectedToMongo) {
      const sender = await UserModel.findById(senderId);
      const receiver = await UserModel.findById(receiverId);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      if (sender.blockedUsers.includes(receiverId) || receiver.blockedUsers.includes(senderId)) {
        throw new Error('Cannot send friend request: Blocked user interaction');
      }

      if (sender.friends.includes(receiverId)) {
        throw new Error('You are already friends');
      }

      const existing = await FriendRequestModel.findOne({
        $or: [
          { sender: senderId, receiver: receiverId, status: 'pending' },
          { sender: receiverId, receiver: senderId, status: 'pending' }
        ]
      });

      if (existing) {
        throw new Error('A friend request is already pending');
      }

      const request = new FriendRequestModel({
        sender: senderId,
        receiver: receiverId,
        status: 'pending'
      });

      const saved = await request.save();
      return {
        ...saved.toObject(),
        id: saved._id.toString(),
        sender: formatUser(sender),
        receiver: formatUser(receiver)
      };
    } else {
      const sender = await this.findUserById(senderId);
      const receiver = await this.findUserById(receiverId);

      if (!sender || !receiver) {
        throw new Error('User not found');
      }

      const senderBlocked = sender.blockedUsers || [];
      const receiverBlocked = receiver.blockedUsers || [];

      if (senderBlocked.includes(receiverId) || receiverBlocked.includes(senderId)) {
        throw new Error('Cannot send friend request: Blocked user interaction');
      }

      const senderFriends = sender.friends || [];
      if (senderFriends.includes(receiverId)) {
        throw new Error('You are already friends');
      }

      const existing = inMemoryFriendRequests.find(r => 
        (r.sender === senderId && r.receiver === receiverId && r.status === 'pending') ||
        (r.sender === receiverId && r.receiver === senderId && r.status === 'pending')
      );

      if (existing) {
        throw new Error('A friend request is already pending');
      }

      const id = 'request-' + Math.random().toString(36).substr(2, 9);
      const request = {
        id,
        _id: id,
        sender: senderId,
        receiver: receiverId,
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      inMemoryFriendRequests.push(request);
      return {
        ...request,
        sender,
        receiver
      };
    }
  },

  async acceptFriendRequest(requestId: string, userId: string) {
    if (isConnectedToMongo) {
      const request = await FriendRequestModel.findById(requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }

      if (request.receiver.toString() !== userId) {
        throw new Error('Unauthorized to accept this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      request.status = 'accepted';
      await request.save();

      await UserModel.findByIdAndUpdate(request.sender, { $addToSet: { friends: request.receiver } });
      await UserModel.findByIdAndUpdate(request.receiver, { $addToSet: { friends: request.sender } });

      await FriendRequestModel.deleteMany({
        sender: request.receiver,
        receiver: request.sender,
        status: 'pending'
      });

      return {
        id: request._id.toString(),
        sender: request.sender.toString(),
        receiver: request.receiver.toString(),
        status: 'accepted'
      };
    } else {
      const requestIndex = inMemoryFriendRequests.findIndex(r => r.id === requestId || r._id === requestId);
      if (requestIndex === -1) {
        throw new Error('Friend request not found');
      }

      const request = inMemoryFriendRequests[requestIndex];
      if (request.receiver !== userId) {
        throw new Error('Unauthorized to accept this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      request.status = 'accepted';
      inMemoryFriendRequests[requestIndex] = request;

      let sender = null;
      let senderKey = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === request.sender || u._id === request.sender) {
          sender = u;
          senderKey = key;
          break;
        }
      }
      if (sender && senderKey) {
        const friends = sender.friends || [];
        if (!friends.includes(request.receiver)) {
          friends.push(request.receiver);
        }
        inMemoryUsers.set(senderKey, { ...sender, friends });
      }

      let receiver = null;
      let receiverKey = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === request.receiver || u._id === request.receiver) {
          receiver = u;
          receiverKey = key;
          break;
        }
      }
      if (receiver && receiverKey) {
        const friends = receiver.friends || [];
        if (!friends.includes(request.sender)) {
          friends.push(request.sender);
        }
        inMemoryUsers.set(receiverKey, { ...receiver, friends });
      }

      for (let i = inMemoryFriendRequests.length - 1; i >= 0; i--) {
        const r = inMemoryFriendRequests[i];
        if (r.sender === request.receiver && r.receiver === request.sender && r.status === 'pending') {
          inMemoryFriendRequests.splice(i, 1);
        }
      }

      return request;
    }
  },

  async rejectFriendRequest(requestId: string, userId: string) {
    if (isConnectedToMongo) {
      const request = await FriendRequestModel.findById(requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }

      if (request.receiver.toString() !== userId) {
        throw new Error('Unauthorized to reject this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      request.status = 'rejected';
      await request.save();

      return {
        id: request._id.toString(),
        sender: request.sender.toString(),
        receiver: request.receiver.toString(),
        status: 'rejected'
      };
    } else {
      const requestIndex = inMemoryFriendRequests.findIndex(r => r.id === requestId || r._id === requestId);
      if (requestIndex === -1) {
        throw new Error('Friend request not found');
      }

      const request = inMemoryFriendRequests[requestIndex];
      if (request.receiver !== userId) {
        throw new Error('Unauthorized to reject this request');
      }

      if (request.status !== 'pending') {
        throw new Error('Request is no longer pending');
      }

      request.status = 'rejected';
      inMemoryFriendRequests[requestIndex] = request;

      return request;
    }
  },

  async cancelFriendRequest(requestId: string, userId: string) {
    if (isConnectedToMongo) {
      const request = await FriendRequestModel.findById(requestId);
      if (!request) {
        throw new Error('Friend request not found');
      }

      if (request.sender.toString() !== userId) {
        throw new Error('Unauthorized to cancel this request');
      }

      await FriendRequestModel.deleteOne({ _id: requestId });
      return true;
    } else {
      const requestIndex = inMemoryFriendRequests.findIndex(r => r.id === requestId || r._id === requestId);
      if (requestIndex === -1) {
        throw new Error('Friend request not found');
      }

      const request = inMemoryFriendRequests[requestIndex];
      if (request.sender !== userId) {
        throw new Error('Unauthorized to cancel this request');
      }

      inMemoryFriendRequests.splice(requestIndex, 1);
      return true;
    }
  },

  async unfriend(userId: string, targetId: string) {
    if (isConnectedToMongo) {
      await UserModel.findByIdAndUpdate(userId, { $pull: { friends: targetId } });
      await UserModel.findByIdAndUpdate(targetId, { $pull: { friends: userId } });

      await FriendRequestModel.deleteMany({
        $or: [
          { sender: userId, receiver: targetId },
          { sender: targetId, receiver: userId }
        ]
      });

      return true;
    } else {
      let u1 = null;
      let u1Key = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          u1 = u;
          u1Key = key;
          break;
        }
      }
      if (u1 && u1Key) {
        const friends = (u1.friends || []).filter((f: string) => f !== targetId);
        inMemoryUsers.set(u1Key, { ...u1, friends });
      }

      let u2 = null;
      let u2Key = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === targetId || u._id === targetId) {
          u2 = u;
          u2Key = key;
          break;
        }
      }
      if (u2 && u2Key) {
        const friends = (u2.friends || []).filter((f: string) => f !== userId);
        inMemoryUsers.set(u2Key, { ...u2, friends });
      }

      for (let i = inMemoryFriendRequests.length - 1; i >= 0; i--) {
        const r = inMemoryFriendRequests[i];
        if ((r.sender === userId && r.receiver === targetId) || (r.sender === targetId && r.receiver === userId)) {
          inMemoryFriendRequests.splice(i, 1);
        }
      }

      return true;
    }
  },

  async blockUser(userId: string, targetId: string) {
    if (isConnectedToMongo) {
      await UserModel.findByIdAndUpdate(userId, { $addToSet: { blockedUsers: targetId } });

      await UserModel.findByIdAndUpdate(userId, { $pull: { friends: targetId } });
      await UserModel.findByIdAndUpdate(targetId, { $pull: { friends: userId } });

      await FriendRequestModel.deleteMany({
        $or: [
          { sender: userId, receiver: targetId },
          { sender: targetId, receiver: userId }
        ]
      });

      return true;
    } else {
      let blocker = null;
      let blockerKey = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          blocker = u;
          blockerKey = key;
          break;
        }
      }
      if (blocker && blockerKey) {
        const blockedUsers = blocker.blockedUsers || [];
        if (!blockedUsers.includes(targetId)) {
          blockedUsers.push(targetId);
        }
        const friends = (blocker.friends || []).filter((f: string) => f !== targetId);
        inMemoryUsers.set(blockerKey, { ...blocker, blockedUsers, friends });
      }

      let blocked = null;
      let blockedKey = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === targetId || u._id === targetId) {
          blocked = u;
          blockedKey = key;
          break;
        }
      }
      if (blocked && blockedKey) {
        const friends = (blocked.friends || []).filter((f: string) => f !== userId);
        inMemoryUsers.set(blockedKey, { ...blocked, friends });
      }

      for (let i = inMemoryFriendRequests.length - 1; i >= 0; i--) {
        const r = inMemoryFriendRequests[i];
        if ((r.sender === userId && r.receiver === targetId) || (r.sender === targetId && r.receiver === userId)) {
          inMemoryFriendRequests.splice(i, 1);
        }
      }

      return true;
    }
  },

  async unblockUser(userId: string, targetId: string) {
    if (isConnectedToMongo) {
      await UserModel.findByIdAndUpdate(userId, { $pull: { blockedUsers: targetId } });
      return true;
    } else {
      let blocker = null;
      let blockerKey = null;
      for (const [key, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          blocker = u;
          blockerKey = key;
          break;
        }
      }
      if (blocker && blockerKey) {
        const blockedUsers = (blocker.blockedUsers || []).filter((b: string) => b !== targetId);
        inMemoryUsers.set(blockerKey, { ...blocker, blockedUsers });
      }
      return true;
    }
  },

  async getFriendsList(userId: string) {
    if (isConnectedToMongo) {
      const user = await UserModel.findById(userId).populate('friends');
      if (!user) return [];
      return (user.friends || []).map((f: any) => formatUser(f));
    } else {
      const user = await this.findUserById(userId);
      if (!user) return [];
      const friendsIds = user.friends || [];
      const friends = [];
      for (const fId of friendsIds) {
        const fObj = await this.findUserById(fId);
        if (fObj) {
          friends.push(fObj);
        }
      }
      return friends;
    }
  },

  async getMutualFriends(userId: string, otherUserId: string) {
    const user1Friends = await this.getFriendsList(userId);
    const user2Friends = await this.getFriendsList(otherUserId);

    const user1FriendsIds = user1Friends.map(f => f.id);
    const mutual = user2Friends.filter(f => user1FriendsIds.includes(f.id));
    return mutual;
  },

  async getFriendRequestStatus(userId: string, otherUserId: string) {
    if (userId === otherUserId) {
      return { status: 'self' };
    }

    const currentUser = await this.findUserById(userId);
    const otherUser = await this.findUserById(otherUserId);

    if (!currentUser || !otherUser) {
      return { status: 'none' };
    }

    const blockedUsers = currentUser.blockedUsers || [];
    if (blockedUsers.includes(otherUserId)) {
      return { status: 'blocking' };
    }

    const otherBlockedUsers = otherUser.blockedUsers || [];
    if (otherBlockedUsers.includes(userId)) {
      return { status: 'blocked' };
    }

    const friends = currentUser.friends || [];
    if (friends.includes(otherUserId)) {
      return { status: 'friends' };
    }

    if (isConnectedToMongo) {
      const request = await FriendRequestModel.findOne({
        $or: [
          { sender: userId, receiver: otherUserId, status: 'pending' },
          { sender: otherUserId, receiver: userId, status: 'pending' }
        ]
      });

      if (request) {
        if (request.sender.toString() === userId) {
          return { status: 'pending_sent', requestId: request._id.toString() };
        } else {
          return { status: 'pending_received', requestId: request._id.toString() };
        }
      }
    } else {
      const request = inMemoryFriendRequests.find(r => 
        ((r.sender === userId && r.receiver === otherUserId) || (r.sender === otherUserId && r.receiver === userId)) &&
        r.status === 'pending'
      );

      if (request) {
        if (request.sender === userId) {
          return { status: 'pending_sent', requestId: request.id || request._id };
        } else {
          return { status: 'pending_received', requestId: request.id || request._id };
        }
      }
    }

    return { status: 'none' };
  },

  async getFriendSuggestions(userId: string) {
    const allUsers = await this.getAllUsers();
    const currentUser = await this.findUserById(userId);
    if (!currentUser) return [];

    const myFriends = currentUser.friends || [];
    const myBlocked = currentUser.blockedUsers || [];

    const pendingWithUser: string[] = [];
    if (isConnectedToMongo) {
      const requests = await FriendRequestModel.find({
        $or: [{ sender: userId }, { receiver: userId }],
        status: 'pending'
      });
      for (const r of requests) {
        if (r.sender.toString() === userId) {
          pendingWithUser.push(r.receiver.toString());
        } else {
          pendingWithUser.push(r.sender.toString());
        }
      }
    } else {
      for (const r of inMemoryFriendRequests) {
        if (r.status === 'pending') {
          if (r.sender === userId) {
            pendingWithUser.push(r.receiver);
          } else if (r.receiver === userId) {
            pendingWithUser.push(r.sender);
          }
        }
      }
    }

    const excludedIds = [userId, ...myFriends, ...myBlocked, ...pendingWithUser];

    const suggestions = [];

    for (const user of allUsers) {
      const uId = user.id || user._id;
      if (excludedIds.includes(uId)) continue;
      
      const userBlocked = user.blockedUsers || [];
      if (userBlocked.includes(userId)) continue;

      const userFriends = user.friends || [];
      const mutualFriends = myFriends.filter((f: string) => userFriends.includes(f));
      
      suggestions.push({
        ...user,
        mutualFriendsCount: mutualFriends.length
      });
    }

    suggestions.sort((a, b) => b.mutualFriendsCount - a.mutualFriendsCount);

    return suggestions;
  },

  // ==========================================
  // CHAT & CONVERSATIONS
  // ==========================================
  async getConversations(userId: string) {
    if (isConnectedToMongo) {
      const convs = await ConversationModel.find({ participants: userId })
        .populate('participants', 'name profilePhoto email')
        .sort({ updatedAt: -1 });
      
      const enriched = await Promise.all(convs.map(async (c: any) => {
        const lastMsg = await MessageModel.findOne({ conversation: c._id }).sort({ createdAt: -1 });
        const obj = c.toObject();
        obj.id = obj._id.toString();
        if (lastMsg) {
          const lastMsgObj = lastMsg.toObject();
          lastMsgObj.id = lastMsgObj._id.toString();
          obj.lastMessage = lastMsgObj;
        }
        return obj;
      }));
      return enriched.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    } else {
      const convs = inMemoryConversations.filter(c => c.participants.includes(userId));
      const enriched = convs.map(c => {
        const msgs = inMemoryMessages.filter(m => m.conversation === c.id);
        const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : undefined;
        return {
          ...c,
          participants: c.participants.map((pid: string) => {
            for (const u of inMemoryUsers.values()) {
              if (u.id === pid || u._id === pid) return formatUser(u);
            }
            return { id: pid, name: 'Unknown' };
          }),
          lastMessage: lastMsg
        };
      });
      return enriched.sort((a, b) => {
        const dateA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt).getTime();
        const dateB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt).getTime();
        return dateB - dateA;
      });
    }
  },

  async getMessages(conversationId: string, limit = 50, skip = 0) {
    if (isConnectedToMongo) {
      const messages = await MessageModel.find({ conversation: conversationId })
        .populate('sender', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      return messages.reverse().map((m: any) => {
        const obj = m.toObject();
        obj.id = obj._id.toString();
        return obj;
      });
    } else {
      const messages = inMemoryMessages
        .filter(m => m.conversation === conversationId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit)
        .reverse()
        .map(m => {
          let sender = null;
          for (const u of inMemoryUsers.values()) {
            if (u.id === m.sender || u._id === m.sender) {
              sender = formatUser(u);
              break;
            }
          }
          return { ...m, sender };
        });
      return messages;
    }
  },

  async startConversation(participants: string[], isGroup = false, groupName?: string) {
    if (isConnectedToMongo) {
      if (!isGroup && participants.length === 2) {
        // Check if exists
        const existing = await ConversationModel.findOne({
          isGroup: false,
          participants: { $all: participants, $size: 2 }
        }).populate('participants', 'name profilePhoto');
        if (existing) {
          const obj = existing.toObject();
          obj.id = obj._id.toString();
          return obj;
        }
      }
      const conv = new ConversationModel({ participants, isGroup, groupName });
      await conv.save();
      const populated = await ConversationModel.findById(conv._id).populate('participants', 'name profilePhoto');
      const obj = populated.toObject();
      obj.id = obj._id.toString();
      return obj;
    } else {
      if (!isGroup && participants.length === 2) {
        const existing = inMemoryConversations.find(c => 
          !c.isGroup && 
          c.participants.length === 2 && 
          c.participants.includes(participants[0]) && 
          c.participants.includes(participants[1])
        );
        if (existing) {
          return {
            ...existing,
            participants: existing.participants.map((pid: string) => {
              for (const u of inMemoryUsers.values()) {
                if (u.id === pid || u._id === pid) return formatUser(u);
              }
              return { id: pid, name: 'Unknown' };
            })
          };
        }
      }
      const newConv = {
        id: crypto.randomUUID(),
        participants,
        isGroup,
        groupName,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      inMemoryConversations.push(newConv);
      return {
        ...newConv,
        participants: newConv.participants.map((pid: string) => {
          for (const u of inMemoryUsers.values()) {
            if (u.id === pid || u._id === pid) return formatUser(u);
          }
          return { id: pid, name: 'Unknown' };
        })
      };
    }
  },

  async sendMessage(conversationId: string, senderId: string, text?: string, media?: string) {
    if (isConnectedToMongo) {
      const msg = new MessageModel({ conversation: conversationId, sender: senderId, text, media, readBy: [senderId] });
      await msg.save();
      await ConversationModel.findByIdAndUpdate(conversationId, { updatedAt: new Date() });
      const populated = await MessageModel.findById(msg._id).populate('sender', 'name profilePhoto');
      const obj = populated.toObject();
      obj.id = obj._id.toString();
      return obj;
    } else {
      const newMsg = {
        id: crypto.randomUUID(),
        conversation: conversationId,
        sender: senderId,
        text,
        media,
        readBy: [senderId],
        createdAt: new Date().toISOString()
      };
      inMemoryMessages.push(newMsg);
      const conv = inMemoryConversations.find(c => c.id === conversationId);
      if (conv) conv.updatedAt = new Date().toISOString();
      
      let sender = null;
      for (const u of inMemoryUsers.values()) {
        if (u.id === senderId || u._id === senderId) {
          sender = formatUser(u);
          break;
        }
      }
      return { ...newMsg, sender };
    }
  },

  async markMessageRead(messageId: string, userId: string) {
    if (isConnectedToMongo) {
      await MessageModel.findByIdAndUpdate(messageId, { $addToSet: { readBy: userId } });
    } else {
      const msg = inMemoryMessages.find(m => m.id === messageId);
      if (msg && !msg.readBy.includes(userId)) {
        msg.readBy.push(userId);
      }
    }
  },

  // ==========================================
  // NOTIFICATIONS
  // ==========================================
  async getNotifications(userId: string, limit = 20, skip = 0) {
    if (isConnectedToMongo) {
      const notifs = await NotificationModel.find({ recipient: userId })
        .populate('sender', 'name profilePhoto')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      return notifs.map((n: any) => {
        const obj = n.toObject();
        obj.id = obj._id.toString();
        return obj;
      });
    } else {
      return inMemoryNotifications
        .filter(n => n.recipient === userId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(skip, skip + limit)
        .map(n => {
          let sender = null;
          for (const u of inMemoryUsers.values()) {
            if (u.id === n.sender || u._id === n.sender) {
              sender = formatUser(u);
              break;
            }
          }
          return { ...n, sender };
        });
    }
  },

  async createNotification(recipientId: string, senderId: string, type: string, relatedPost?: string, relatedComment?: string) {
    if (recipientId === senderId) return null; // Don't notify yourself
    if (isConnectedToMongo) {
      const notif = new NotificationModel({ recipient: recipientId, sender: senderId, type, relatedPost, relatedComment });
      await notif.save();
      const populated = await NotificationModel.findById(notif._id).populate('sender', 'name profilePhoto');
      const obj = populated.toObject();
      obj.id = obj._id.toString();
      return obj;
    } else {
      const newNotif = {
        id: crypto.randomUUID(),
        recipient: recipientId,
        sender: senderId,
        type,
        relatedPost,
        relatedComment,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      inMemoryNotifications.push(newNotif);
      
      let sender = null;
      for (const u of inMemoryUsers.values()) {
        if (u.id === senderId || u._id === senderId) {
          sender = formatUser(u);
          break;
        }
      }
      return { ...newNotif, sender };
    }
  },

  async markNotificationRead(notificationId: string) {
    if (isConnectedToMongo) {
      await NotificationModel.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      const notif = inMemoryNotifications.find(n => n.id === notificationId);
      if (notif) notif.isRead = true;
    }
  },

  async markAllNotificationsRead(userId: string) {
    if (isConnectedToMongo) {
      await NotificationModel.updateMany({ recipient: userId, isRead: false }, { isRead: true });
    } else {
      inMemoryNotifications.forEach(n => {
        if (n.recipient === userId) n.isRead = true;
      });
    }
  },

  // ==========================================
  // GROUPS & PAGES
  // ==========================================
  async createGroup(data: any) {
    if (isConnectedToMongo) {
      const group = new GroupModel({ ...data, members: [data.creator], admins: [data.creator] });
      await group.save();
      return (await GroupModel.findById(group._id).populate('creator').populate('admins').populate('members')).toObject();
    } else {
      const newGroup = {
        id: crypto.randomUUID(),
        ...data,
        members: [data.creator],
        admins: [data.creator],
        pendingRequests: [],
        createdAt: new Date().toISOString()
      };
      inMemoryGroups.push(newGroup);
      return newGroup;
    }
  },

  async getGroups() {
    if (isConnectedToMongo) {
      return await GroupModel.find().populate('creator members').sort({ createdAt: -1 });
    } else {
      return inMemoryGroups;
    }
  },

  async getGroupById(groupId: string) {
    if (isConnectedToMongo) {
      const g = await GroupModel.findById(groupId).populate('creator admins members pendingRequests');
      if (!g) return null;
      const obj = g.toObject();
      obj.id = obj._id.toString();
      return obj;
    } else {
      const g = inMemoryGroups.find(x => x.id === groupId);
      if (!g) return null;
      return {
        ...g,
        members: g.members.map((mId: string) => {
          for (const u of inMemoryUsers.values()) {
            if (u.id === mId || u._id === mId) return formatUser(u);
          }
          return { id: mId, name: 'Unknown' };
        })
      };
    }
  },

  async requestJoinGroup(groupId: string, userId: string) {
    if (isConnectedToMongo) {
      const group = await GroupModel.findById(groupId);
      if (!group) throw new Error("Group not found");
      if (group.privacy === 'public') {
        if (!group.members.includes(userId)) group.members.push(userId);
      } else {
        if (!group.members.includes(userId) && !group.pendingRequests.includes(userId)) {
          group.pendingRequests.push(userId);
        }
      }
      await group.save();
      return group;
    } else {
      const group = inMemoryGroups.find(g => g.id === groupId);
      if (!group) throw new Error("Group not found");
      if (group.privacy === 'public') {
        if (!group.members.includes(userId)) group.members.push(userId);
      } else {
        if (!group.members.includes(userId) && !group.pendingRequests.includes(userId)) {
          group.pendingRequests.push(userId);
        }
      }
      return group;
    }
  },

  async approveJoinGroup(groupId: string, userId: string) {
    if (isConnectedToMongo) {
      await GroupModel.findByIdAndUpdate(groupId, {
        $pull: { pendingRequests: userId },
        $addToSet: { members: userId }
      });
    } else {
      const group = inMemoryGroups.find(g => g.id === groupId);
      if (group) {
        group.pendingRequests = group.pendingRequests.filter((id: string) => id !== userId);
        if (!group.members.includes(userId)) group.members.push(userId);
      }
    }
  },

  async leaveGroup(groupId: string, userId: string) {
    if (isConnectedToMongo) {
      await GroupModel.findByIdAndUpdate(groupId, {
        $pull: { members: userId, admins: userId, pendingRequests: userId }
      });
    } else {
      const group = inMemoryGroups.find(g => g.id === groupId);
      if (group) {
        group.members = group.members.filter((id: string) => id !== userId);
        group.admins = group.admins.filter((id: string) => id !== userId);
        group.pendingRequests = group.pendingRequests.filter((id: string) => id !== userId);
      }
    }
  },

  async createPage(data: any) {
    if (isConnectedToMongo) {
      const page = new PageModel({ ...data, admins: [data.creator], followers: [] });
      await page.save();
      return (await PageModel.findById(page._id).populate('creator').populate('admins')).toObject();
    } else {
      const newPage = {
        id: crypto.randomUUID(),
        ...data,
        admins: [data.creator],
        followers: [],
        createdAt: new Date().toISOString()
      };
      inMemoryPages.push(newPage);
      return newPage;
    }
  },

  async getPages() {
    if (isConnectedToMongo) {
      return await PageModel.find().populate('creator').sort({ createdAt: -1 });
    } else {
      return inMemoryPages;
    }
  },

  async getPageById(pageId: string) {
    if (isConnectedToMongo) {
      const p = await PageModel.findById(pageId).populate('creator admins followers');
      if (!p) return null;
      const obj = p.toObject();
      obj.id = obj._id.toString();
      return obj;
    } else {
      return inMemoryPages.find(x => x.id === pageId);
    }
  },

  async followPage(pageId: string, userId: string) {
    if (isConnectedToMongo) {
      await PageModel.findByIdAndUpdate(pageId, { $addToSet: { followers: userId } });
    } else {
      const page = inMemoryPages.find(p => p.id === pageId);
      if (page && !page.followers.includes(userId)) page.followers.push(userId);
    }
  },
  
  async unfollowPage(pageId: string, userId: string) {
    if (isConnectedToMongo) {
      await PageModel.findByIdAndUpdate(pageId, { $pull: { followers: userId } });
    } else {
      const page = inMemoryPages.find(p => p.id === pageId);
      if (page) page.followers = page.followers.filter((id: string) => id !== userId);
    }
  },

  // ==========================================
  // STORIES & ALBUMS
  // ==========================================
  async createStory(data: any) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now
    if (isConnectedToMongo) {
      const story = new StoryModel({ ...data, expiresAt, viewers: [] });
      await story.save();
      return (await StoryModel.findById(story._id).populate('author')).toObject();
    } else {
      const newStory = {
        id: crypto.randomUUID(),
        ...data,
        expiresAt: expiresAt.toISOString(),
        viewers: [],
        createdAt: new Date().toISOString()
      };
      inMemoryStories.push(newStory);
      return newStory;
    }
  },

  async getActiveStoriesFeed(userId: string) {
    // Get friends
    const friends = await this.getFriendsList(userId);
    const friendIds = friends.map((f: any) => f.id || f._id.toString());
    friendIds.push(userId); // include self

    let activeStories = [];
    const now = new Date();

    if (isConnectedToMongo) {
      activeStories = await StoryModel.find({ 
        author: { $in: friendIds },
        expiresAt: { $gt: now }
      }).populate('author').sort({ createdAt: 1 });
    } else {
      activeStories = inMemoryStories.filter(s => 
        friendIds.includes(s.author) && new Date(s.expiresAt) > now
      ).map(s => {
        const author = inMemoryUsers.get(s.author) || { id: s.author, name: 'Unknown' };
        return { ...s, author: formatUser(author) };
      }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    }

    // Group by author
    const grouped = new Map();
    for (const story of activeStories) {
      const authorId = story.author.id || story.author._id.toString();
      if (!grouped.has(authorId)) {
        grouped.set(authorId, {
          user: story.author,
          stories: [],
          allSeen: true
        });
      }
      const group = grouped.get(authorId);
      const isSeen = story.viewers?.some((v: any) => v.toString() === userId);
      if (!isSeen) group.allSeen = false;
      group.stories.push({ ...story.toObject?.() || story, id: story._id?.toString() || story.id });
    }
    
    // Convert to array and sort: unseen first, then by latest story
    return Array.from(grouped.values()).sort((a, b) => {
      if (a.user.id === userId) return -1; // own stories always first
      if (b.user.id === userId) return 1;
      if (a.allSeen === b.allSeen) {
        return new Date(b.stories[b.stories.length-1].createdAt).getTime() - new Date(a.stories[a.stories.length-1].createdAt).getTime();
      }
      return a.allSeen ? 1 : -1;
    });
  },

  async markStoryViewed(storyId: string, userId: string) {
    if (isConnectedToMongo) {
      await StoryModel.findByIdAndUpdate(storyId, { $addToSet: { viewers: userId } });
    } else {
      const story = inMemoryStories.find(s => s.id === storyId);
      if (story && !story.viewers.includes(userId)) {
        story.viewers.push(userId);
      }
    }
  },

  async createAlbum(data: any) {
    if (isConnectedToMongo) {
      const album = new AlbumModel(data);
      await album.save();
      return album.toObject();
    } else {
      const newAlbum = {
        id: crypto.randomUUID(),
        ...data,
        createdAt: new Date().toISOString()
      };
      inMemoryAlbums.push(newAlbum);
      return newAlbum;
    }
  },

  async getUserAlbums(userId: string) {
    if (isConnectedToMongo) {
      return await AlbumModel.find({ owner: userId }).sort({ createdAt: -1 });
    } else {
      return inMemoryAlbums.filter(a => a.owner === userId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async addPhotosToAlbum(albumId: string, newPhotos: string[]) {
    if (isConnectedToMongo) {
      return await AlbumModel.findByIdAndUpdate(albumId, { $push: { photos: { $each: newPhotos } } }, { new: true });
    } else {
      const album = inMemoryAlbums.find(a => a.id === albumId);
      if (album) {
        album.photos = [...(album.photos || []), ...newPhotos];
      }
      return album;
    }
  },

  // ==========================================
  // SEARCH UNIFIED
  // ==========================================
  async searchUnified(query: string, type: 'users'|'posts'|'groups'|'pages'|'all', userId?: string) {
    const q = query.trim();
    if (!q) {
      return type === 'all' ? { users: [], posts: [], groups: [], pages: [] } : [];
    }
    const regexQuery = { $regex: q, $options: 'i' };

    if (isConnectedToMongo) {
      const results: any = { users: [], posts: [], groups: [], pages: [] };

      // Helper for User
      if (type === 'users' || type === 'all') {
        results.users = await UserModel.find({
          $or: [
            { name: regexQuery },
            { bio: regexQuery }
          ],
          suspended: { $ne: true }
        }).limit(20);
        results.users = results.users.map((u: any) => formatUser(u));
      }

      // Helper for Post
      if (type === 'posts' || type === 'all') {
        const posts = await PostModel.find({
          text: regexQuery,
          visibility: 'public'
        }).populate('author').sort({ createdAt: -1 }).limit(20);
        results.posts = await Promise.all(posts.map(async (p: any) => {
          const commentCount = await CommentModel.countDocuments({ post: p._id });
          return {
            ...p.toObject(),
            id: p._id.toString(),
            author: formatUser(p.author),
            commentCount
          };
        }));
      }

      // Helper for Group
      if (type === 'groups' || type === 'all') {
        const groups = await GroupModel.find({
          $or: [
            { name: regexQuery },
            { description: regexQuery }
          ]
        }).limit(20);
        results.groups = groups.map((g: any) => ({ ...g.toObject(), id: g._id.toString() }));
      }

      // Helper for Page
      if (type === 'pages' || type === 'all') {
        const pages = await PageModel.find({
          $or: [
            { name: regexQuery },
            { description: regexQuery }
          ]
        }).limit(20);
        results.pages = pages.map((p: any) => ({ ...p.toObject(), id: p._id.toString() }));
      }

      return type === 'all' ? results : results[type];
    } else {
      const results: any = { users: [], posts: [], groups: [], pages: [] };
      const searchStr = q.toLowerCase();

      if (type === 'users' || type === 'all') {
        results.users = Array.from(inMemoryUsers.values())
          .filter(u => !u.suspended && (u.name.toLowerCase().includes(searchStr) || (u.bio && u.bio.toLowerCase().includes(searchStr))))
          .map(u => formatUser(u));
      }

      if (type === 'posts' || type === 'all') {
        results.posts = inMemoryPosts
          .filter(p => p.text.toLowerCase().includes(searchStr) && p.visibility === 'public')
          .map(p => {
            const author = inMemoryUsers.get(p.author) || { name: 'Unknown' };
            const comments = inMemoryComments.filter(c => c.post === p.id);
            return {
              ...p,
              author: formatUser(author),
              commentCount: comments.length
            };
          });
      }

      if (type === 'groups' || type === 'all') {
        results.groups = inMemoryGroups.filter(g => g.name.toLowerCase().includes(searchStr) || (g.description && g.description.toLowerCase().includes(searchStr)));
      }

      if (type === 'pages' || type === 'all') {
        results.pages = inMemoryPages.filter(p => p.name.toLowerCase().includes(searchStr) || (p.description && p.description.toLowerCase().includes(searchStr)));
      }

      return type === 'all' ? results : results[type];
    }
  },

  // ==========================================
  // PRIVACY SETTINGS
  // ==========================================
  async updatePrivacySettings(userId: string, settings: { defaultPostVisibility?: string, friendRequestSender?: string, friendsListVisibility?: string }) {
    if (isConnectedToMongo) {
      const updateObj: any = {};
      if (settings.defaultPostVisibility) updateObj['privacySettings.defaultPostVisibility'] = settings.defaultPostVisibility;
      if (settings.friendRequestSender) updateObj['privacySettings.friendRequestSender'] = settings.friendRequestSender;
      if (settings.friendsListVisibility) updateObj['privacySettings.friendsListVisibility'] = settings.friendsListVisibility;
      
      const user = await UserModel.findByIdAndUpdate(userId, { $set: updateObj }, { new: true });
      return formatUser(user);
    } else {
      let targetUserEmail = '';
      for (const [email, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          targetUserEmail = email;
          break;
        }
      }
      if (targetUserEmail) {
        const u = inMemoryUsers.get(targetUserEmail);
        u.privacySettings = {
          ...(u.privacySettings || {
            defaultPostVisibility: 'public',
            friendRequestSender: 'everyone',
            friendsListVisibility: 'everyone'
          }),
          ...settings
        };
        inMemoryUsers.set(targetUserEmail, u);
        return formatUser(u);
      }
      return null;
    }
  },

  // ==========================================
  // REPORTS SYSTEM
  // ==========================================
  async createReport(data: { reporter: string, targetType: 'post'|'comment'|'user', targetId: string, reason: string }) {
    if (isConnectedToMongo) {
      const report = new ReportModel(data);
      await report.save();
      return report.toObject();
    } else {
      const newReport = {
        id: crypto.randomUUID(),
        _id: crypto.randomUUID(),
        ...data,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      inMemoryReports.push(newReport);
      return newReport;
    }
  },

  async getReports() {
    if (isConnectedToMongo) {
      return await ReportModel.find().populate('reporter').sort({ createdAt: -1 });
    } else {
      return inMemoryReports.map(r => {
        const reporterUser = Array.from(inMemoryUsers.values()).find(u => u.id === r.reporter || u._id === r.reporter);
        return {
          ...r,
          reporter: reporterUser ? formatUser(reporterUser) : null
        };
      }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async updateReportStatus(reportId: string, status: 'pending' | 'reviewed') {
    if (isConnectedToMongo) {
      return await ReportModel.findByIdAndUpdate(reportId, { status }, { new: true });
    } else {
      const report = inMemoryReports.find(r => r.id === reportId || r._id === reportId);
      if (report) {
        report.status = status;
      }
      return report;
    }
  },

  // ==========================================
  // ADMIN PANEL
  // ==========================================
  async getAdminStats() {
    if (isConnectedToMongo) {
      const totalUsers = await UserModel.countDocuments();
      const totalPosts = await PostModel.countDocuments();
      const totalReports = await ReportModel.countDocuments({ status: 'pending' });
      const activeToday = Math.ceil(totalUsers * 0.4) || 1; 

      return { totalUsers, totalPosts, totalReports, activeToday };
    } else {
      const totalUsers = inMemoryUsers.size;
      const totalPosts = inMemoryPosts.length;
      const totalReports = inMemoryReports.filter(r => r.status === 'pending').length;
      const activeToday = Math.max(1, Math.ceil(totalUsers * 0.7));

      return { totalUsers, totalPosts, totalReports, activeToday };
    }
  },

  async getAdminUsers(query?: string) {
    if (isConnectedToMongo) {
      const filter: any = {};
      if (query) {
        filter.$or = [
          { name: { $regex: query, $options: 'i' } },
          { email: { $regex: query, $options: 'i' } }
        ];
      }
      const users = await UserModel.find(filter).sort({ createdAt: -1 });
      return users.map((u: any) => formatUser(u));
    } else {
      let list = Array.from(inMemoryUsers.values());
      if (query) {
        const q = query.toLowerCase();
        list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));
      }
      return list.map(u => formatUser(u)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
  },

  async suspendUser(userId: string, suspended: boolean) {
    if (isConnectedToMongo) {
      const user = await UserModel.findByIdAndUpdate(userId, { suspended }, { new: true });
      return formatUser(user);
    } else {
      let targetEmail = '';
      for (const [email, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          targetEmail = email;
          break;
        }
      }
      if (targetEmail) {
        const u = inMemoryUsers.get(targetEmail);
        u.suspended = suspended;
        inMemoryUsers.set(targetEmail, u);
        return formatUser(u);
      }
      return null;
    }
  },

  async deleteUser(userId: string) {
    if (isConnectedToMongo) {
      await UserModel.findByIdAndDelete(userId);
      await PostModel.deleteMany({ author: userId });
      await ReportModel.deleteMany({ reporter: userId });
      return true;
    } else {
      let targetEmail = '';
      for (const [email, u] of inMemoryUsers.entries()) {
        if (u.id === userId || u._id === userId) {
          targetEmail = email;
          break;
        }
      }
      if (targetEmail) {
        inMemoryUsers.delete(targetEmail);
        const postsToDelete = inMemoryPosts.filter(p => p.author === userId).map(p => p.id);
        for (const pid of postsToDelete) {
          const idx = inMemoryPosts.findIndex(p => p.id === pid);
          if (idx !== -1) inMemoryPosts.splice(idx, 1);
        }
        return true;
      }
      return false;
    }
  }
};
