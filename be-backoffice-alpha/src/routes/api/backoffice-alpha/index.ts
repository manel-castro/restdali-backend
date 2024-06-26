import { FieldsRouter } from "./fields";
import { ValuesRouter } from "./values";
import { GeneralConfigRouter } from "./generalConfig";
import { PagesRouter } from "./pages";
import { ProjectsRouter } from "./projects";
import { SectionsRouter } from "./sections";

const express = require("express");

const router = express.Router();

/**
 * {mergeParams:true}
 * https://stackoverflow.com/questions/25260818/rest-with-express-js-nested-router
 */

console.log("hello world");

router.use("/backoffice-alpha", ProjectsRouter);
router.use("/backoffice-alpha", PagesRouter);
router.use("/backoffice-alpha", SectionsRouter);
router.use("/backoffice-alpha", FieldsRouter);
router.use("/backoffice-alpha", ValuesRouter);
router.use("/backoffice-alpha", GeneralConfigRouter);

export { router as BackofficeRouter };
