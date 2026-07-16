export interface Category {
  _id: string;
  name: string;
}

export interface Genre {
  _id: string;
  name: string;
}

export interface Movie {
  _id: string;
  title: string;
  year: number;
  poster: string;
  category?: Category;
  genre?: Genre[];
}