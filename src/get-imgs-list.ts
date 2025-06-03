import { App, TFolder, TFile } from "obsidian";
import renderError from "./render-error";

const getImagesRecursive = (
  folder: TFolder,
  container: HTMLElement,
  recursive: boolean
) => {
  // retrieve a list of the files
  const files = folder.children;

  // filter the list of files to make sure we're dealing with images only
  const validExtensions = ["jpeg", "jpg", "gif", "png", "webp", "tiff", "tif"];
  const images = files.reduce<TFile[]>((acc, file) => {
    if (file instanceof TFile && validExtensions.includes(file.extension)) {
      acc.push(file);
    } else if (file instanceof TFolder && recursive) {
      acc.push(...getImagesRecursive(file, container, recursive));
    }
    return acc;
  }, []);
  return images;
};

const getImagesList = (
  app: App,
  container: HTMLElement,
  settings: { [key: string]: any }
) => {
  // retrieve a list of the files located in the folder and subfolders
  const folder = app.vault.getAbstractFileByPath(settings.path);

  if (!(folder instanceof TFolder)) {
    const error = "The folder doesn't exist, or it's empty!";
    renderError(container, error);
    throw new Error(error);
  }

  const images = getImagesRecursive(folder, container, settings.subfolders);

  // sort the list by name, mtime, or ctime
  const orderedImages = images.sort((a: any, b: any) => {
    const refA =
      settings.sortby === "name"
        ? a["name"].toUpperCase()
        : a.stat[settings.sortby];
    const refB =
      settings.sortby === "name"
        ? b["name"].toUpperCase()
        : b.stat[settings.sortby];
    return refA < refB ? -1 : refA > refB ? 1 : 0;
  });

  // re-sort again by ascending or descending order
  const sortedImages =
    settings.sort === "asc" ? orderedImages : orderedImages.reverse();

  // return an array of objects
  return sortedImages.map((file) => {
    return {
      name: file.name,
      folder: file.parent.path,
      uri: app.vault.adapter.getResourcePath(file.path),
    };
  });
};

export default getImagesList;
