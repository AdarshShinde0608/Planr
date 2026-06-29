const mongoose = require('mongoose');
const { LocalModel } = require('./localDb');

let isMongoConnected = false;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    console.warn('⚠️ No MONGODB_URI found in environment. Running in Local JSON Database mode.');
    isMongoConnected = false;
    return;
  }
  try {
    // Connect with a short timeout (3s) to prevent blocking startup
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    isMongoConnected = true;
    console.log('✅ Connected to MongoDB successfully.');
  } catch (error) {
    console.warn('⚠️ MongoDB connection failed. Running in Local JSON Database mode.');
    isMongoConnected = false;
  }
};

class DynamicModel {
  constructor(modelName, schemaDefinition) {
    this.modelName = modelName;
    this.schemaDefinition = schemaDefinition;
    this._localModel = null;
    this._mongooseModel = null;
  }

  _getModel() {
    if (isMongoConnected) {
      if (!this._mongooseModel) {
        try {
          this._mongooseModel = mongoose.model(this.modelName);
        } catch (e) {
          this._mongooseModel = mongoose.model(
            this.modelName,
            new mongoose.Schema(this.schemaDefinition, { timestamps: true })
          );
        }
      }
      return this._mongooseModel;
    } else {
      if (!this._localModel) {
        const { LocalModel } = require('./localDb');
        this._localModel = new LocalModel(this.modelName);
      }
      return this._localModel;
    }
  }

  async find(query = {}) {
    return this._getModel().find(query);
  }

  async findOne(query = {}) {
    return this._getModel().findOne(query);
  }

  async findById(id) {
    return this._getModel().findById(id);
  }

  async create(doc) {
    return this._getModel().create(doc);
  }

  async findByIdAndUpdate(id, update, options = {}) {
    return this._getModel().findByIdAndUpdate(id, update, options);
  }

  async findByIdAndDelete(id) {
    return this._getModel().findByIdAndDelete(id);
  }

  async deleteMany(query = {}) {
    return this._getModel().deleteMany(query);
  }
}

const getModel = (modelName, schemaDefinition) => {
  return new DynamicModel(modelName, schemaDefinition);
};

module.exports = {
  connectDB,
  getModel,
  isMongoConnected: () => isMongoConnected
};

