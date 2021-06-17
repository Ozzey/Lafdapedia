const express = require('express')
const Article = require('./../models/article')
const router = express.Router()
const passport = require('passport')


//

router.get('/new',checkAuthenticated, (req,res) => {
  res.render('articles/new', { article: new Article() })
})

router.get('/edit/:id',checkAuthenticated ,async (req, res) => {
  const article = await Article.findById(req.params.id)
  res.render('articles/edit', { article: article })
})

router.get('/:slug', async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug })
  if (article == null) res.redirect('/admin')
  res.render('articles/show', { article: article })
})


///CREATE NEW AND EDIT ROUTE ///
router.post('/', async (req, res, next) => {
  req.article = new Article()
  next()
}, saveArticleAndRedirect('new'))


router.put('/:id', async (req, res, next) => {
  req.article = await Article.findById(req.params.id)
  next()
}, saveArticleAndRedirect('edit'))
///***************************************///

///DELETE ARTICLE ROUTE ///
router.delete('/:id', async (req,res) => {
  await Article.findByIdAndDelete(req.params.id)
  res.redirect('/admin')
})


///PIT AND POST FUNCTION ///
function saveArticleAndRedirect(path) {
  return async (req, res) => {
    let article = req.article
    article.title = req.body.title
    article.description = req.body.description
    article.markdown = req.body.markdown
    try {
      article = await article.save()
      res.redirect(`/articles/${article.slug}`)
    } catch (e) {
      res.render(`articles/${path}`, { article: article })
    }
  }
}

///CHECK AUTHENTICATION///
function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

  res.redirect('/admin/login')
}

function checkNotAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return res.redirect('/admin/login')
  }
  next()
}
///*****************************************///
//***************//
module.exports = router
