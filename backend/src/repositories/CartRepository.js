const prisma = require('../config/database');

const ITEM_INCLUDE = {
  product: {
    select: {
      id: true,
      name: true,
      image_url: true,
      stock_quantity: true,
      status: true,
      price: true,
      provider: { select: { id: true, business_name: true } },
    },
  },
};

class CartRepository {
  async findOrCreateByUser(userId) {
    let cart = await prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { added_at: 'asc' } } },
    });
    if (!cart) {
      cart = await prisma.cart.create({
        data: { user_id: userId },
        include: { items: { include: ITEM_INCLUDE } },
      });
    }
    return cart;
  }

  findByUser(userId) {
    return prisma.cart.findUnique({
      where: { user_id: userId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { added_at: 'asc' } } },
    });
  }

  reloadWithItems(cartId) {
    return prisma.cart.findUnique({
      where: { id: cartId },
      include: { items: { include: ITEM_INCLUDE, orderBy: { added_at: 'asc' } } },
    });
  }

  findItemByProduct(cartId, productId) {
    return prisma.cartItem.findUnique({
      where: { cart_id_product_id: { cart_id: cartId, product_id: productId } },
    });
  }

  findItemById(itemId, cartId) {
    return prisma.cartItem.findFirst({ where: { id: itemId, cart_id: cartId } });
  }

  countItems(cartId) {
    return prisma.cartItem.count({ where: { cart_id: cartId } });
  }

  createItem(data) {
    return prisma.cartItem.create({ data });
  }

  updateItem(id, data) {
    return prisma.cartItem.update({ where: { id }, data });
  }

  deleteItem(id) {
    return prisma.cartItem.delete({ where: { id } });
  }

  deleteAllItems(cartId) {
    return prisma.cartItem.deleteMany({ where: { cart_id: cartId } });
  }

  touch(cartId) {
    return prisma.cart.update({ where: { id: cartId }, data: { updated_at: new Date() } });
  }
}

module.exports = new CartRepository();
