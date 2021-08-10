import {
  createEntitiesStore,
  createTodo,
  createUIEntityStore,
  createUITodo,
} from '../mocks/stores.mock';
import { getEntity, hasEntity } from './queries';
import { addEntities } from './add.mutation';
import { entitiesUIRef } from './entity.state';

describe('queries', () => {
  describe('getEntity', () => {
    it('should return an entity', () => {
      const store = createEntitiesStore();

      expect(store.query(getEntity(1))).toEqual(undefined);
      const todo = createTodo(1);
      store.reduce(addEntities(todo));
      expect(store.query(getEntity(1))).toEqual(todo);
    });
  });

  describe('hasEntity', () => {
    it('should check whether the entity exists', () => {
      const store = createEntitiesStore();

      expect(store.query(hasEntity(1))).toEqual(false);

      store.reduce(addEntities(createTodo(1)));
      expect(store.query(hasEntity(1))).toEqual(true);
    });

    it('should work with ref', () => {
      const store = createUIEntityStore();
      expect(store.query(hasEntity(1, { ref: entitiesUIRef }))).toEqual(false);

      store.reduce(addEntities(createUITodo(1), { ref: entitiesUIRef }));
      expect(store.query(hasEntity(1, { ref: entitiesUIRef }))).toEqual(true);
    });
  });
});
