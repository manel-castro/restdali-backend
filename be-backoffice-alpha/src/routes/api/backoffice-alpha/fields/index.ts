import { NextFunction, Request, Response } from "express";
import { check, param } from "express-validator";
import { validateRequest } from "../../../../middlewares/validate-request";
import { prisma } from "../../../../prismaclient";

import { BadRequestError } from "../../../../errors/bad-request-error";
import { currentUser } from "../../../../middlewares/current-user";
import { requireIsSuperAdmin } from "../../../../middlewares/require-role";

const express = require("express");

const router = express.Router();

router.get(
  "/fields",
  validateRequest,
  async function (req: Request, res: Response, next: NextFunction) {
    const existingFields = await prisma.field.findMany({
      where: {},
      include: {
        Section: true,
        valuesByProject: true,
      },
    });

    return res.status(201).send(existingFields);
  }
);

router.get(
  "/fields/:id",
  [param("id", "Is badly formatted").isString()],

  validateRequest,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const existingFields = await prisma.field.findFirst({
      where: { id },
      include: {
        valuesByProject: {
          select: { values: true, projectId: true, name: true, id: true },
        },
      },
    });

    return res.status(201).send(existingFields);
  }
);

router.post(
  "/fields",
  [
    check("name", "name is needed").isString(),
    check("component", "component is needed").isString(),
    check("translationsLabel", "translationsLabel is needed").isArray(),
    check("translationsLabel.*", "translationsLabel is needed").isString(),
    check("valuesOrder", "valuesOrder is needed").isArray(),
    check("valuesOrder.*", "valuesOrder is needed").isString(),
  ],
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const {
      name,
      component,
      translationsLabel,
      valuesOrder,
      translationsValue,
    } = req.body;

    await prisma.field.create({
      data: {
        name,
        translationsLabel,
        component,
        valuesByProjectOrder: valuesOrder,
      },
    });

    return res.status(201).send();
  }
);

router.post(
  "/fields/addNew",
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const generalNewField = {
      name: "new field",
      translationsLabel: ["translation"],
      component: "text",
      valuesByProjectOrder: [""],
    };

    await prisma.field.create({
      data: generalNewField,
    });

    return res.status(201).send();
  }
);

router.patch(
  "/fields/:id",
  [param("id", "Is badly formatted").isString()],

  [
    check("name", "name is needed").optional(),
    check("pageNameId", "pageNameId is needed").optional(),
    check("component", "component is needed").optional(),

    check("Project", "Project is needed").optional(),
    check("projectId", "projectId is needed").optional(),
    check("PageName", "PageName is needed").optional(),
    check("translationsLabel", "translationsLabel is needed")
      .isArray()
      .optional(),
    check("translationsValue.*", "translationsValue is needed")
      .isString()
      .optional(),
  ],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const {
      name,
      pageNameId,
      component,
      Project,
      projectId,
      PageName,
      translationsLabel,
      translationsValue,
    } = req.body;
    const { id } = req.params;

    const existingField = await prisma.field.findFirst({
      where: {
        id,
      },
      include: {
        Section: true,
      },
    });

    if (!existingField) {
      return next(new BadRequestError("field doesn't exist"));
    }

    await prisma.field.update({
      where: {
        id,
      },

      data: {
        name: name || existingField.name,
        component: component || existingField.component,
        translationsLabel: translationsLabel || existingField.translationsLabel,
      },
    });

    return res.status(204).send();
  }
);

router.delete(
  "/fields/:id",
  [param("id", "Is badly formatted").isString()],
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const existingField = await prisma.field.findFirst({
      where: {
        id,
      },
    });

    if (!existingField) {
      return next(new BadRequestError("Project doesn't exist"));
    }
    await prisma.field.delete({
      where: {
        id,
      },
    });

    return res.status(204).send();
  }
);

export { router as FieldsRouter };
