// Global app controller
// 84a87682342302396506c612e89380ab
import Search from './models/Search';
import { elements, renderLoader, clearLoader } from './views/base';
import * as searchView from './views/searchView';
import * as recipeView from './views/recipeView';
import * as listView from './views/listView';
import * as likesView from './views/likesView';
import Recipe from './models/Recipe';
import List from './models/List';
import Likes from "./models/Likes";

//global state
const state = {

};

//SEARCH

const controlSearch = async () => {
   // get query from view
  const query = searchView.getInput();

  if(query) {
    //new search object and edit state
    state.search = new Search(query);

    //loading spinner
    searchView.clearInput();
    searchView.clearResults();
    renderLoader(elements.searchRes);

    //search for recipes
    await state.search.getResults();

    // render results
    clearLoader();
    searchView.renderResults(state.search.result);
  }
};

elements.searchForm.addEventListener('submit', e => {
  e.preventDefault();
  controlSearch();
});

elements.searchResPages.addEventListener('click', e => {
  const btn = e.target.closest('.btn-inline');
  if(btn) {
    const goToPage = parseInt(btn.dataset.goto, 10);
    searchView.clearResults();
    searchView.renderResults(state.search.result, goToPage);
  }
});

// RECIPE

const controlRecipe = async () => {
  const id = window.location.hash.replace('#', '');

  if(id) {
    recipeView.clearRecipe();
    renderLoader(elements.recipe);

    if(state.search) {
      searchView.highlightSelected(id);
    }

    //new recipe object
    state.recipe = new Recipe(id);
    window.r = state.recipe;

    try {
      //get recipe data
      await state.recipe.getRecipe();
      state.recipe.parseIngredients();

      //serving and time
      state.recipe.calcTime();
      state.recipe.calcServings();

      //render recipe
      clearLoader();
      recipeView.renderRecipe(state.recipe, state.likes.isLike(id));
    } catch(error) {
      alert(error);
    }
  }
};

['hashchange', 'load'].forEach(event => window.addEventListener(event, controlRecipe));

elements.recipe.addEventListener('click', e => {
  if(e.target.matches('.btn-decrease, .btn-decrease *')) {
    if(state.recipe.servings > 1) {
      state.recipe.updateServings('dec');
      recipeView.updateServingsIngredients(state.recipe);
    }

  } else if(e.target.matches('.btn-increase, .btn-increase *')) {
    state.recipe.updateServings('inc');
    recipeView.updateServingsIngredients(state.recipe);
  } else if(e.target.matches('.recipe__btn--add, .recipe__btn--add *')) {
    controlList()
  } else if(e.target.matches('.recipe__love, .recipe__love *')) {
    controlLike()
  }
});


// LIST
const controlList = () => {
    if(!state.list) state.list = new List();

    state.recipe.ingredients.forEach(ingredient => {
      const item = state.list.addItem(ingredient.count, ingredient.unit, ingredient.ingredient);
      listView.renderItem(item);
    })
};

elements.shopping.addEventListener('click', e => {
  const id = e.target.closest('.shopping__item').dataset.itemid;

  if(e.target.matches('.shopping__delete, .shopping__delete *')) {
    state.list.deleteItem(id);

    listView.deleteItem(id);
  } else if(e.target.matches('.shopping__count-value')) {
    const val = parseFloat(e.target.value, 10);
    state.list.updateCount(id, val);
  }
});

// LIKE
const controlLike = () => {
  const currentId = state.recipe.id;

  if(!state.likes) {
    state.likes = new Likes();
  }

  if(!state.likes.isLike(currentId)) {
    const newLike = state.likes.addLike(currentId, state.recipe.title, state.recipe.author, state.recipe.img);
    likesView.toggleLikeBtn(true);
    likesView.renderLike(newLike);
  } else {
    state.likes.deleteLike(currentId);
    likesView.toggleLikeBtn(false);
    likesView.deleteLike(currentId);
  }
  likesView.toggleLikeMenu(state.likes.getNumLikes());
};

window.addEventListener("load", () => {
  state.likes = new Likes();
  state.likes.readStorage();
  likesView.toggleLikeMenu(state.likes.getNumLikes());
  state.likes.likes.forEach(like => likesView.renderLike(like));
});