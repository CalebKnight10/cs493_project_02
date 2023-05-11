const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const reviews = require('../data/reviews');
const mysqlPool = require('../lib/mysqlpool.js');

exports.router = router;
exports.reviews = reviews;

/*
 * Schema describing required/optional fields of a review object.
 */
const reviewSchema = {
  userid: { required: true },
  businessid: { required: true },
  dollars: { required: true },
  stars: { required: true },
  review: { required: false }
};

async function insertReview(review) {
  const validatedReview = extractValidFields(
    review,
    reviewSchema
  );
  const [ result ] = await mysqlPool.query(
    'INSERT INTO reviews SET ?',
    validatedReview
  );
  return result.insertId;
}

/*
 * Route to create a new review.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const id = await insertReview(req.body);
      res.status(201).send({ id: id, links: {review: `/reviews/${id}`, business: `/businesses/${id}`} });
    } catch (err) {
      res.status(500).send({
        error: "Error inserting review into database."
      })
    }
  } else {
    res.status(400).json({
      error: "Request body is not a valid review object"
    });
  }
});

async function getReviews(reviewID) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM reviews WHERE id = ?',
    [ reviewID ],
  );
  return results[0];
}

/*
 * Route to fetch info about a specific review.
 */
router.get('/:reviewID', async (req, res, next) => {
  try {
    const review = await
    getReviews(parseInt(req.params.reviewID));
    if (review) {
      res.status(200).send(review);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Not able to fetch review."
    });
  }
});

async function updateReview(reviewID, review) {
  const validatedReview = extractValidFields(
    review,
    reviewSchema
  );
  const [ result ] = await mysqlPool.query(
    'UPDATE reviews SET ? WHERE id = ?',
    [ validatedReview, reviewID ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to update a review.
 */
router.put('/:reviewID', async (req, res, next) => {
  if (validateAgainstSchema(req.body, reviewSchema)) {
    try {
      const updateSuccessful = await
        updateReview(parseInt(req.params.id), req.body);
      if (updateSuccessful) {
        res.status(200).send({
          links: {
            review: `/reviews/${reviewID}`
          }
        });
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: "Not able to update review."
      });
    }
  } else {
    res.status(400).json({
      error: "Request body does not contain a valid review."
    });
  }
});

async function deleteReview(reviewID) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM reviews WHERE id = ?',
    [ reviewID ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to delete a review.
 */
router.delete('/:reviewID', async (req, res, next) => {
  try {
    const deleteSuccessful = await
        deleteReview(parseInt(req.params.id));
    if (deleteSuccessful) {
            res.status(204).end();
    } else {
        next();
    }
} catch (err) {
    res.status(500).send({
        error: "Not able to delete review."
    });
  }
});

async function getReviewsByUserId(userid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM review WHERE userid = ?',
    [ userid ],
  );
  return results[0];
}