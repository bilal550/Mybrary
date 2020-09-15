const express = require('express');
const router = express.Router();
const multer = require('multer')
const Book = require('../models/book');
const fs = require('fs')
const path = require('path');
const uploadPath = path.join('public', Book.coverImageBasePath);
const Author = require('../models/author');
const imageMimeTypes = ['image/jpeg', 'image/png', 'image/gif']
const upload = multer({
  dest: uploadPath,
  fileFilter: (req, file, callBack) => {
    callBack(null, imageMimeTypes.includes(file.mimetype))
  }
})


// All authors route
router.get('/', async (req, res) => {
  let query = Book.find();
  if (req.query.title != null && req.query.title != '') {
    query = query.regex('title', new RegExp(req.query.title, 'i'))
  }
  if (req.query.publishedBefore != null && req.query.publishedBefore != '') {
    query = query.lte('publishDate', req.query.publishedBefore)
  }
  if (req.query.publishedAfter != null && req.query.publishedAfter != '') {
    query = query.lte('publishDate', req.query.publishedAfter)
  }
  try {
    const books = await query.exec();
    res.render('books/index', {
      books: books,
      searchOptions: req.query
    })
  } catch (err) {
    res.redirect('/')
    console.error(err)
  }
})

// New Authors Route
router.get('/new', async (req, res) => {
  renderNewPage(res, new Book())
})

// Create Book Route
router.post('/', upload.single('cover'), async (req, res) => {
  const fileName = req.file != null ? req.file.filename : null
  console.log(req.body.title)
  const book = new Book({
    title: req.body.title,
    author: req.body.author,
    publishDate: new Date(req.body.publishDate),
    pageCount: parseInt(req.body.pageCount),
    coverImageName: fileName,
    description: req.body.description,
    createdAt: Date.now()
  })
  try {
    const newBook = await book.save();
    // res.redirect(`books/${newBook.id}`);
    res.redirect('books');
  } catch (err) {
    if (book.coverImageName != null) {
      removeBookCover(book.coverImageName)
    }
    renderNewPage(res, book, true)
    // console.log('Error', book)
  }
})

function removeBookCover(fileName) {
  fs.unlink(path.join(uploadPath, fileName), err => {
    if (err) console.error(err);
  })
}

async function renderNewPage(res, book, hasError = false) {
  try {
    const authors = await Author.find({});
    const params = {
      authors: authors,
      book: book
    }
    if (hasError) params.errorMessage = 'Error Creating Book';
    res.render('books/new', params)
  } catch {
    res.redirect('/books')
  }
}

module.exports = router