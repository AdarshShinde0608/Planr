const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class LocalModel {
  constructor(collectionName) {
    this.collectionName = collectionName;
    this.filePath = path.join(DATA_DIR, `${collectionName.toLowerCase()}s.json`);
  }

  _read() {
    if (!fs.existsSync(this.filePath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(data || '[]');
    } catch (e) {
      console.error(`Error reading file-database: ${this.filePath}`, e);
      return [];
    }
  }

  _write(data) {
    try {
      fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (e) {
      console.error(`Error writing file-database: ${this.filePath}`, e);
    }
  }

  async find(query = {}) {
    const items = this._read();
    return items.filter(item => {
      for (const key in query) {
        // Simple query evaluation
        if (query[key] && typeof query[key] === 'object' && !Array.isArray(query[key])) {
          // Handle simple $gte, $lte, etc. for scheduling
          const operators = query[key];
          if (operators.$gte !== undefined && item[key] < operators.$gte) return false;
          if (operators.$lte !== undefined && item[key] > operators.$lte) return false;
          if (operators.$gt !== undefined && item[key] <= operators.$gt) return false;
          if (operators.$lt !== undefined && item[key] >= operators.$lt) return false;
        } else {
          if (item[key] !== query[key]) return false;
        }
      }
      return true;
    });
  }

  async findOne(query = {}) {
    const items = this._read();
    return items.find(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return false;
      }
      return true;
    }) || null;
  }

  async findById(id) {
    const items = this._read();
    return items.find(item => item._id === id || item.id === id) || null;
  }

  async create(doc) {
    const items = this._read();
    const newDoc = {
      _id: Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...doc
    };
    items.push(newDoc);
    this._write(items);
    return newDoc;
  }

  async findByIdAndUpdate(id, update, options = {}) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;

    let updatedFields = update;
    if (update.$set) {
      updatedFields = { ...update.$set };
    }

    // Process nested update if needed, else merge
    items[index] = {
      ...items[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };

    this._write(items);
    return items[index];
  }

  async findByIdAndDelete(id) {
    const items = this._read();
    const index = items.findIndex(item => item._id === id || item.id === id);
    if (index === -1) return null;
    const deleted = items.splice(index, 1)[0];
    this._write(items);
    return deleted;
  }

  async deleteMany(query = {}) {
    const items = this._read();
    const remaining = items.filter(item => {
      for (const key in query) {
        if (item[key] !== query[key]) return true;
      }
      return false;
    });
    this._write(remaining);
    return { deletedCount: items.length - remaining.length };
  }
}

module.exports = { LocalModel };
