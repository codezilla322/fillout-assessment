require("dotenv").config();

const express = require("express");
const axios = require("axios");
const app = express();
const port = 80;

const FILLOUT_API_KEY = process.env.FILLOUT_API_KEY;

app.get("/", (req, res) => {
  res.send("Hello world!");
});

app.get("/:formId/filteredResponses", async (req, res) => {
  const formId = req.params.formId;
  const limit = req.query.limit;
  const afterDate = req.query.afterDate;
  const beforeDate = req.query.beforeDate;
  const offset = req.query.offset;
  const status = req.query.status;
  const includeEditLink = req.query.includeEditLink;
  const sort = req.query.sort;
  const filtersStr = req.query.filters;
  let filters = JSON.parse(filtersStr ? filtersStr : "[]");
  if (!Array.isArray(filters)) filters = [filters];

  const response = await axios.get(
    `https://api.fillout.com/v1/api/forms/${formId}/submissions?${
      limit ? `limit=${limit}&` : ""
    }${afterDate ? `afterDate=${afterDate}&` : ""}${
      beforeDate ? `beforeDate=${beforeDate}&` : ""
    }${offset ? `offset=${offset}&` : ""}${status ? `status=${status}&` : ""}${
      includeEditLink ? `includeEditLink=${includeEditLink}&` : ""
    }${sort ? `sort=${sort}&` : ""}`,
    {
      headers: {
        Authorization: `Bearer ${FILLOUT_API_KEY}`,
      },
    }
  );

  const responses = response.data.responses;
  const filteredResponses = responses.filter((response) => {
    let questions = {};

    response.questions.map((question) => {
      questions[question.id] = question.value;
    });

    const filtered = filters.reduce((filtered, filter, index) => {
      if (!filtered) return filtered;

      const questionValue = questions[filter.id];
      if (questionValue === undefined && filter.condition !== "does_not_equal")
        return false;

      switch (filter.condition) {
        case "equals":
          if (questionValue === filter.value) {
            return true;
          } else {
            return false;
          }
        case "does_not_equal":
          if (questionValue !== filter.value) {
            return true;
          } else {
            return false;
          }
        case "greater_than":
          if (questionValue > filter.value) {
            return true;
          } else {
            return false;
          }
        case "less_than":
          if (questionValue < filter.value) {
            return true;
          } else {
            return false;
          }
        default:
          return false;
      }
    }, true);

    return filtered;
  });

  res.json({ ...response.data, responses: filteredResponses });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
