import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const worlds=sqliteTable('worlds',{
  id:text('id').primaryKey(),ownerId:text('owner_id').notNull(),name:text('name').notNull(),seed:integer('seed').notNull(),snapshot:text('snapshot').notNull(),revision:integer('revision').notNull().default(0),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},table=>[index('idx_worlds_owner').on(table.ownerId),index('idx_worlds_updated').on(table.updatedAt)]);
