const router = require('express').Router();
const { validateAgainstSchema, extractValidFields } = require('../lib/validation');

const businesses = require('../data/businesses');
const { reviews } = require('./reviews');
const { photos } = require('./photos');

exports.router = router;
exports.businesses = businesses;

/*
 * Schema describing required/optional fields of a business object.
 */
const businessSchema = {
  ownerid: { required: true },
  name: { required: true },
  address: { required: true },
  city: { required: true },
  state: { required: true },
  zip: { required: true },
  phone: { required: true },
  category: { required: true },
  subcategory: { required: true },
  website: { required: false },
  email: { required: false }
};

// /*
//  * Route to return a list of businesses.
//  */
// router.get('/', function (req, res) {
//   /*
//    * Compute page number based on optional query string parameter `page`.
//    * Make sure page is within allowed bounds.
//    */
//   let page = parseInt(req.query.page) || 1;
//   const numPerPage = 10;
//   const lastPage = Math.ceil(businesses.length / numPerPage);
//   page = page > lastPage ? lastPage : page;
//   page = page < 1 ? 1 : page;
//   /*
//    * Calculate starting and ending indices of businesses on requested page and
//    * slice out the corresponsing sub-array of businesses.
//    */
//   const start = (page - 1) * numPerPage;
//   const end = start + numPerPage;
//   const pageBusinesses = businesses.slice(start, end);
//   /*
//    * Generate HATEOAS links for surrounding pages.
//    */
//   const links = {};
//   if (page < lastPage) {
//     links.nextPage = `/businesses?page=${page + 1}`;
//     links.lastPage = `/businesses?page=${lastPage}`;
//   }
//   if (page > 1) {
//     links.prevPage = `/businesses?page=${page - 1}`;
//     links.firstPage = '/businesses?page=1';
//   }
//   /*
//    * Construct and send response.
//    */
//   res.status(200).json({
//     businesses: pageBusinesses,
//     pageNumber: page,
//     totalPages: lastPage,
//     pageSize: numPerPage,
//     totalCount: businesses.length,
//     links: links
//   });
// });


// Route to get list of businesses (use mysqlquery page to handle getting the page and the count)
router.get('/', async (req, res) => {
  // const [ results ] = await mysqlPool.query(
  //   "SELECT COUNT(*) AS count FROM lodgings"
  //   );
  const count = getCounts(businesses);
  try {
    const businessPage = await getPage(parseInt(req.query.page) || 1, businesses);
    res.status(200).send(businessPage);
  } catch (err) {
    res.status(500).json({
      error: "Error fetching business list. Try again later."
    });
  }
});


// Create new business
async function createNewBusiness(business) {
  const validBusiness = extractValidFields(
    business,
    businessSchema
  );
  const [ result ] = await mysqlPool.query(
    'INSERT INTO businesses SET ?',
    validBusiness
  );
  return result.insertId;

  /*
   * Route to create a new business.
   */
  router.post('/', async (req, res, next) => {
    if (validateAgainstSchema(req.body, businessSchema)) {
      try {
        const id = await createNewBusiness(req.body);
        res.status(201).send({
          id: id,
          links: {
            business: `/businesses/${business.id}`
          } });
        } catch (err) {
          res.status (500).send({
            error: "Error inserting new business into DataBase."
          });
        }
      } else {
      res.status(400).json({
        error: "Request body is not a valid business object"
      });
    }
  });
}

async function getBusinessesId(businessid) {
  const [ results ] = await mysqlPool.query(
    'SELECT * FROM businesses WHERE id = ?',
    [ businessid ],
  );
  return results[0];
}

/*
 * Route to fetch info about a specific business.
 */
router.get('/:businessid', async (req, res, next) => {
  try {
    const business = await getBusinessesId(parseInt(req.params.id));
    if (business) {
      res.status(200).send(business);
    } else {
      next();
    }
  } catch (err) {
    res.status(500).send({
      error: "Error, not able to fetch business."
    });
  }
      /*
       * Find all reviews and photos for the specified business and create a
       * new object containing all of the business data, including reviews and
       * photos.
       */
  //     const business = {
  //       reviews: reviews.filter(review => review && review.businessid === businessid),
  //       photos: photos.filter(photo => photo && photo.businessid === businessid)
  //     };
  //     Object.assign(business, businesses[businessid]);
  //     res.status(200).json(business);
  //   } else {
  //     next();
  //   }
  //  }
});

async function updateBusiness(businessid, business) {
  const validatedBusiness = extractValidFields(
    business,
    businessSchema
  );
  const [ result ] = await mysqlPool.query(
    'UPDATE businesses SET ? WHERE id = ?',
    [ validatedBusiness, businessid ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to replace data for a business.
 */
router.put('/:businessid', async (req, res, next) => {
  if(validateAgainstSchema(req.body, businessSchema)) {
    try {
      const updateConfirm = await updateBusiness(parseInt(req.params.id), req.body);
      if(updateConfirm) {
        res.status(200).send({
          links: { business: `/businesses/${businessid}`}
        });
      } else {
        next();
      }
    } catch (err) {
      res.status(500).send({
        error: 'Not able to update business.'
      });
    }
  } else {
    res.status(400).send({
      error: 'Request body does not hold a valid business'
    });
  }
});

async function deleteBusiness(businessid) {
  const [ result ] = await mysqlPool.query(
    'DELETE FROM businesses WHERE id = ?',
    [ businessid ]
  );
  return result.affectedRows > 0;
}

/*
 * Route to delete a business.
 */
router.delete('/:businessid', async (req, res, next) => {
  try {
    const deleteConfirm = await deleteBusiness(parseInt(req.params.id));
    if(deleteConfirm) {
      res.status(204).end();
    } else {
        next();
    }
  } catch (err) {
      res.status(500).send({
        error: 'Not able to delete business.'
      });
  }
});