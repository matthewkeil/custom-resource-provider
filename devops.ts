require("dotenv").config();
export default {
  REGION: "us-east-1",
  PROJECT_NAME: "custom-resources",
  SUB_DOMAIN: "custom-resources",
  ROOT_DOMAIN: "nomad.house",
  ROOT_OBJECT: "en/index.html",
  ALLOW_NAKED: true,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  GITHUB_ACCESS_TOKEN: process.env.GITHUB_ACCESS_TOKEN
};
