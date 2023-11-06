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

const postDirectories = await fs.readdir(postsDir);

const postMarkdownFiles = await Promise.all(
  postDirectories.map(dir =>
    fs.readFile(path.join(postsDir, dir, "index.md"), "utf8"),
  ),
);

const posts = postMarkdownFiles.map(file => {
  const { data, content } = frontmatter(file);
  return {
    ...Value.Decode(schema, data),
    readingTime: readingTime(content).time,
  };
});

await Bun.write(
  path.join(postsDir, "index.json"),
  JSON.stringify(posts, null, 2),
);
