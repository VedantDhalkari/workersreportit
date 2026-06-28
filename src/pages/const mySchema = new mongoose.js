const mySchema = new mongoose.Schema({
  macId: { type: String, unique: true } // <-- 1st index definition
});

mySchema.index({ macId: 1 }); // <-- 2nd index definition (Remove this line)
