import fs from "node:fs/promises";
import path from "node:path";
import frontmatter from "gray-matter";
import { Type } from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";
import readingTime from "reading-time";

const postsDir = path.resolve(import.meta.dir, "..", "posts");

const schema = Type.Object({
  title: Type.String(),
  description: Type.String(),
  published: Type.Date(),
  tags: Type.Array(Type.String()),
});

const postsDirListing = await fs.readdir(postsDir, { withFileTypes: true });

const postDirectories = postsDirListing
  .filter(x => x.isDirectory())
  .map(x => x.name);

const postMarkdownFiles = await Promise.all(
  postDirectories.map(async dir => {
    const content = await fs.readFile(
      path.join(postsDir, dir, "index.md"),
      "utf8",
    );
    return [dir, content];
  }),
);

const posts = postMarkdownFiles.map(([name, file]) => {
  const { data, content } = frontmatter(file);
  return {
    name,
    ...Value.Decode(schema, data),
    readingTime: readingTime(content).time,
  };
});

await Bun.write(
  path.join(postsDir, "index.json"),
  JSON.stringify(posts, null, 2),
);
