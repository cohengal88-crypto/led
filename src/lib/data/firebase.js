// Firebase adapter — implemented in stage 4 (Firestore + Auth + Storage).
// Must expose the same methods as demo.js.
export default {
  mode: 'firebase',
  async listProducts() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async listCategories() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async getProduct() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async saveProduct() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async deleteProduct() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async createQuoteRequest() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async listQuoteRequests() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async createContactMessage() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
  async listContactMessages() { throw new Error('Firebase adapter not implemented yet (stage 4)'); },
};
