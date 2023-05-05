const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const photos = require('../data/photos');

exports.router = router;
exports.photos = photos;

/*
 * Schema describing required/optional fields of a photo object.
 */
const photoSchema = {
  userid: { required: true },
  businessid: { required: true },
  caption: { required: false }
};

async function createNewPhoto(photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = await mysqlPool.query(
    'INSERT INTO photos SET ?',
    validatedPhoto
  );
  return result.insertId;
}

/*
 * Route to create a new photo.
 */
router.post('/', async (req, res, next) => {
  if (validateAgainstSchema(req.body, photoSchema)) {
    try {
      const id = await createNewPhoto(req.body);
      res.status(201).send({
        id: id,
        links: {
          photo: `/photos/${id}`,
          business: `/businesses/${business.id}`
        } });
      } catch (err) {
        res.status (500).send({
          error: "Error inserting new photo into DataBase."
        });
      }
    } else {
    res.status(400).send({
      error: "Request body is not a valid photo object"
    });
  }
});

async function getphotoId(photoId) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM photos WHERE id = ?',
    [ photoId ],
  );
  return results[0];
}

/*
 * Route to fetch info about a specific photo.
 */
router.get('/:photoId', async (req, res, next) => {
  try {
    const photo = await getphotoId(parseInt(req.params.id));
    if (photo) {
      res.status(200).send(photo);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Error, not able to fetch photo."
    });
  }
});

async function updatePhoto(photoId, photo) {
  const validatedPhoto = extractValidFields(
    photo,
    photoSchema
  );
  const [ result ] = await mysqlPool.query(
    'UPDATE photos SET ? WHERE id = ?',
    [ validatedPhoto, photoId ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to update a photo.
 */
router.put('/:photoId', async (req, res, next) => {
  if(validateAgainstSchema(req.body, photoSchema)) {
    try {
      const updateConfirm = await updatePhoto(parseInt(req.params.id), req.body);
      if(updateConfirm) {
        res.status(200).send({
          links: { 
            photo: `/photos/${photoId}`, 
            business: `/businesses/${businessid}`}
        });
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: 'Not able to update photo.'
      });
    }
  } else {
    res.status(400).send({
      error: 'Request body does not hold a valid photo'
    });
  }
});

async function deletePhoto(photoId) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM photos WHERE id = ?',
    [ businessid ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to delete a photo.
 */
router.delete('/:photoId', async (req, res, next) => {
  try {
    const deleteConfirm = await deletePhoto(parseInt(req.params.id));
    if(deleteConfirm) {
      res.status(204).end();
    } else {
        next();
    }
  } catch (err) {
      res.status(500).send({
        error: 'Not able to delete photo.'
      });
  }
});