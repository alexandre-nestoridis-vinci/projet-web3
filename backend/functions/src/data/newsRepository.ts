import {firestore} from "firebase-admin";

export const getAllNews = async () => {
  return firestore().collection("news").get();
};

export const getNewsById = async (id: string) => {
  return firestore().collection("news").doc(id).get();
};

export const addNews = async (
  news: FirebaseFirestore.DocumentData
) => {
  return firestore().collection("news").add(news);
};

export const updateNews = async (
  id: string,
  data: FirebaseFirestore.DocumentData
) => {
  return firestore().collection("news").doc(id).update(data);
};

export const deleteNews = async (id: string) => {
  return firestore().collection("news").doc(id).delete();
};
