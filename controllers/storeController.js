const mongoose = require('mongoose')
const Store = mongoose.model('Store')
const multer = require('multer')
const jimp = require('jimp')
const uuid = require('uuid')

const multerOptions = {
  storage: multer.memoryStorage(),
  fileFilter(req, file, next) {
    const isPhoto = file.mimetype.startsWith('image/')
    if (isPhoto) {
      next(null, true)
    } else {
      next({ message: `That filetype isn't allowed!` }, false)
    }
  }
}

exports.addStore = (req, res) => {
  res.render('editStore', { title: 'Add Store' })
}

exports.upload = multer(multerOptions).single('photo')

exports.resize = async (req, res, next) => {
  // Check if there is no new file to resize
  if (!req.file) {
    next()
    return
  }
  const extension = req.file.mimetype.split('/')[1]
  req.body.photo = `${uuid.v4()}.${extension}`

  // Now resize
  const photo = await jimp.read(req.file.buffer)
  await photo.resize(800, jimp.AUTO)
  await photo.write(`./public/uploads/${req.body.photo}`)
  next()
}

exports.createStore = async (req, res) => {
  const store = await new Store(req.body).save()
  req.flash(
    'success',
    `Successfully created ${store.name}. Care to leave a review?`
  )
  res.redirect(`store/${store.slug}`)
}

exports.getStores = async (req, res) => {
  const stores = await Store.find()
  res.render('stores', { title: 'Stores', stores })
}

exports.editStore = async (req, res) => {
  const store = await Store.findOne({ _id: req.params.id })

  // Todo: Confirm they are the owner of the store before rendering the edit form

  res.render('editStore', { title: `Edit ${store.name}`, store })
}

exports.updateStore = async (req, res) => {
  // Set the location data as a Point
  // This fixes a bug where it loses this value when a store gets updated, causing issues with searching by location...
  req.body.location.type = 'Point'

  const store = await Store.findOneAndUpdate({ _id: req.params.id }, req.body, {
    new: true, // Return the new store instead of the old one
    runValidators: true // Ensure checking of the 'required' fields specified in our model (Store.js)
  }).exec()

  req.flash(
    'success',
    `Successfully updated <strong>${store.name}</strong>. <a href="/stores/${
      store.slug
    }">View Store</a>`
  )
  res.redirect(`/stores/${store._id}/edit`)
}
