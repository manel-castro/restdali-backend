import { NextFunction, Request, Response } from "express";
import { check, param } from "express-validator";
import { validateRequest } from "../../../../middlewares/validate-request";
import { prisma } from "../../../../prismaclient";

import { BadRequestError } from "../../../../errors/bad-request-error";
import { currentUser } from "../../../../middlewares/current-user";
import { requireIsSuperAdmin } from "../../../../middlewares/require-role";

const express = require("express");

const router = express.Router();

router.post(
  "/pagesByProjectId",
  [check("id", "id is needed").isString()],
  validateRequest,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id: projectId } = req.body;

    const existingProject = await prisma.project.findFirst({
      where: {
        id: projectId,
      },
      select: {
        pagesOrder: true,
      },
    });

    if (!existingProject) {
      return next(new BadRequestError("project does not exist"));
    }

    const pages = await prisma.page.findMany({
      where: {
        projects: {
          every: { id: projectId },
        },
      },
      select: {
        id: true,
        translations: true,
        name: true,
      },
    });

    const pagesSorted = pages.sort(
      (a, b) =>
        existingProject.pagesOrder.indexOf(a.name) -
        existingProject.pagesOrder.indexOf(b.name)
    );

    return res.status(201).send(pagesSorted);
  }
);

router.get(
  "/pages",
  validateRequest,
  async function (req: Request, res: Response, next: NextFunction) {
    const existingPages = await prisma.page.findMany({
      where: {},
      include: {
        projects: true,
        sections: true,
      },
    });

    return res.status(201).send(existingPages);
  }
);

router.get(
  "/pages/:id",
  [param("id", "id is needed").isString()],

  validateRequest,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const existingPages = await prisma.page.findFirst({
      where: {
        id,
      },
      include: {
        sections: true,
      },
    });

    return res.status(201).send(existingPages);
  }
);

router.post(
  "/pages",
  [
    check("name", "name is needed").isString(),
    check("component", "component is needed").isString(),

    check("translations", "translations is needed").isArray(),
    check("translations.*", "translations is needed").isString(),
  ],
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { name, translations, link, component } = req.body;

    const existingPage = await prisma.page.findFirst({
      where: {
        name,
      },
    });

    if (existingPage) {
      return next(new BadRequestError("Project already exists"));
    }

    const page = await prisma.page.create({
      data: {
        name,
        translations,

        component,
      },
    });

    return res.status(201).send({ id: page.id });
  }
);

router.post(
  "/pages/addNew",
  [],
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const generalNewpage = {
      name: "new page",
      translations: ["translations"],

      component: "text",
    };
    const page = await prisma.page.create({
      data: generalNewpage,
    });

    return res.status(201).send({ id: page.id });
  }
);

router.patch(
  "/pages/:id",
  [param("id", "Is badly formatted").isString()],

  [
    check("name", "name is needed").optional(),
    check("project", "project is needed").optional(),
    check("sections", "sections is needed").optional(),
    check("component", "component is needed").optional(),
    check("projectId", "projectId is needed").optional(),
    check("sectionsOrder", "sectionsOrder is needed").isArray().optional(),
    check("sectionsOrder.*", "sectionsOrder is needed").isString().optional(),
    check("translations", "translations is needed").optional(),
  ],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { name, projects, sections, component, sectionsOrder, translations } =
      req.body;
    const { id } = req.params;

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
      include: {
        projects: true,
        sections: true,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Project doesn't exist"));
    }

    await prisma.page.update({
      where: {
        id,
      },
      data: {
        name: name || existingPage.name,
        // projects: projects || existingPage.projects,
        // sections: sections || existingPage.sections,
        sectionsOrder: sectionsOrder || existingPage.sectionsOrder,
        translations: translations || existingPage.translations,
        component: component || existingPage.component,
      },
    });

    return res.status(204).send();
  }
);

router.delete(
  "/pages/:id",
  [param("id", "Is badly formatted").isString()],
  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Project doesn't exist"));
    }
    await prisma.page.delete({
      where: {
        id,
      },
    });

    return res.status(204).send();
  }
);

export const connectSectionsInPagePrisma = async ({
  sectionIds,
  sectionsOrder,
  pageId,
}: {
  sectionIds: string[];
  sectionsOrder: string[];
  pageId: string;
}) => {
  for (const sectionId of sectionIds) {
    await prisma.page.update({
      where: {
        id: pageId,
      },
      data: {
        sections: { connect: { id: sectionId } },
      },
    });
  }
  await prisma.page.update({
    where: {
      id: pageId,
    },
    data: {
      sectionsOrder,
    },
  });
};

router.patch(
  "/pages/:id/addSections",
  [param("id", "Is badly formatted").isString()],

  [
    check("sectionIds", "sectionIds is needed").isArray(),
    check("sectionIds.*", "sectionIds is needed").isString(),
    check("sectionsOrder", "sectionsOrder is needed").isArray(),
    check("sectionsOrder.*", "sectionsOrder is needed").isString(),
  ],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { sectionIds, sectionsOrder } = req.body;
    const { id } = req.params;

    console.log("sectionIds: ", sectionIds);

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Page doesn't exist"));
    }

    for (const sectionId of sectionIds) {
      const existingPage = await prisma.section.findFirst({
        where: {
          id: sectionId,
        },
      });
      if (!existingPage) {
        return next(new BadRequestError("section doesn't exist"));
      }
    }

    await connectSectionsInPagePrisma({
      pageId: id,
      sectionIds,
      sectionsOrder,
    });

    return res.status(204).send();
  }
);

router.patch(
  "/pages/:id/deleteSections",
  [param("id", "Is badly formatted").isString()],

  [
    check("sectionIds", "sectionIds is needed").isArray(),
    check("sectionIds.*", "sectionIds is needed").isString(),
    check("sectionsOrder", "sectionsOrder is needed").isArray(),
    check("sectionsOrder.*", "sectionsOrder is needed").isString(),
  ],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { sectionIds, sectionsOrder } = req.body;
    const { id } = req.params;

    console.log("sectionIds: ", sectionIds);

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Page doesn't exist"));
    }

    for (const sectionId of sectionIds) {
      const existingPage = await prisma.section.findFirst({
        where: {
          id: sectionId,
        },
      });
      if (!existingPage) {
        return next(new BadRequestError("Project doesn't exist"));
      }
    }
    for (const sectionId of sectionIds) {
      await prisma.page.update({
        where: {
          id,
        },
        data: {
          sections: { disconnect: { id: sectionId } },
          sectionsOrder,
        },
      });
    }
    return res.status(204).send();
  }
);

router.patch(
  "/pages/:id/addNewSection",
  [param("id", "Is badly formatted").isString()],
  [check("id", "Is badly formatted").isString()],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id } = req.params;
    const { id: sectionId } = req.body;

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Page doesn't exist"));
    }

    const existingSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
      },
    });

    if (!existingSection) {
      return next(new BadRequestError("section doesn't exist"));
    }

    await prisma.page.update({
      where: {
        id,
      },
      data: {
        sections: { connect: { id: sectionId } },
        sectionsOrder: [...existingPage.sectionsOrder, sectionId],
      },
    });

    return res.status(204).send();
  }
);

router.delete(
  "/pages/:id/deleteSection/:sectionId",
  [
    param("id", "Is badly formatted").isString(),
    param("sectionId", "pageId is needed").isString(),
  ],

  validateRequest,
  currentUser,
  requireIsSuperAdmin,
  async function (req: Request, res: Response, next: NextFunction) {
    const { id, sectionId } = req.params;

    const existingPage = await prisma.page.findFirst({
      where: {
        id,
      },
    });

    if (!existingPage) {
      return next(new BadRequestError("Page doesn't exist"));
    }

    const existingSection = await prisma.section.findFirst({
      where: {
        id: sectionId,
      },
    });

    if (!existingSection) {
      return next(new BadRequestError("Section doesn't exist"));
    }

    await prisma.page.update({
      where: {
        id,
      },
      data: {
        sections: { disconnect: { id: sectionId } },
        sectionsOrder: [
          ...existingPage.sectionsOrder.filter((item) => item !== sectionId),
        ],
      },
    });

    return res.status(204).send();
  }
);

export { router as PagesRouter };
