import type { Express } from "express";
import { Readable } from "node:stream";
import { and, eq } from "drizzle-orm";
import { engagementDocuments, clientProjectsExtended } from "../drizzle/schema";
import { isInternalRole } from "../shared/roles";
import { sdk } from "./_core/sdk";
import { getDb } from "./db";
import { privateBlobGet } from "./blobStorage";

export function registerDocumentRoutes(app: Express) {
  app.get("/api/documents/:id", async (req, res) => {
    try {
      const user = await sdk.authenticateRequest(req);
      const documentId = Number(req.params.id);
      if (!Number.isInteger(documentId) || documentId <= 0) {
        return res.status(400).send("Invalid document");
      }
      const db = await getDb();
      if (!db) return res.status(503).send("Document service unavailable");

      const [row] = await db
        .select({
          document: engagementDocuments,
          ownerId: clientProjectsExtended.userId,
        })
        .from(engagementDocuments)
        .innerJoin(
          clientProjectsExtended,
          eq(clientProjectsExtended.id, engagementDocuments.projectId),
        )
        .where(and(eq(engagementDocuments.id, documentId)))
        .limit(1);

      if (!row || (!isInternalRole(user.role) && row.ownerId !== user.id)) {
        return res.status(404).send("Document not found");
      }
      if (
        !isInternalRole(user.role) &&
        row.document.type === "quotation" &&
        row.document.status === "draft"
      ) {
        return res.status(404).send("Document not found");
      }

      const result = await privateBlobGet(row.document.fileUrl);
      if (!result || result.statusCode !== 200 || !result.stream) {
        return res.status(404).send("Document not found");
      }

      res.setHeader(
        "Content-Type",
        result.blob.contentType || "application/octet-stream",
      );
      res.setHeader(
        "Content-Disposition",
        `inline; filename*=UTF-8''${encodeURIComponent(row.document.fileName)}`,
      );
      res.setHeader("Cache-Control", "private, max-age=60");
      Readable.fromWeb(result.stream as never).pipe(res);
    } catch {
      res.status(401).send("Sign in to view this document");
    }
  });
}
