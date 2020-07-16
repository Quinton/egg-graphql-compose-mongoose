'use strict';
const path = require('path');
const fs = require('fs');
const { schemaComposer } = require('graphql-compose');
const { composeWithMongoose } = require('graphql-compose-mongoose');

/*
前提：此插件依赖于 mogoose 插件加载并且实例化 mongodb schema model
1. 遍历 model 文件夹 ，CONVERT MONGOOSE MODEL TO GraphQL PIECES
2. 将转换 GraphQL PIECES 挂载在 app.graphqlTC
3. 遍历 graphql 文件夹，加载解析器resolvers
4, 构建schema
*/


module.exports = app => {
  const baseModelPath = path.join(app.baseDir, 'app/model/');
  const dpModelDir = fs.readFileSync(baseModelPath);
  const graphqlTC = {};
  dpModelDir.forEach(file => {
    const dpFile = path.join(baseModelPath, file);
    const stat = fs.statSync(dpFile);
    // 获取结尾为.js的文件名称
    if (stat.isFile() && file.endsWith('.js')) {
      // 需要判断 mogoose 插件是否以及加载 model
      const fileName = path.basename(dpFile, '.js');
      // CONVERT MONGOOSE MODEL TO GraphQL PIECES
      if (app.model[fileName]) {
        Object.assign(graphqlTC, { [`${fileName}TC`]: composeWithMongoose(app.model[fileName]) });
      }
    }

    const baseResolverPath = path.join(app.baseDir, 'app/graphql/');
    const dpResolverDir = fs.readFileSync(baseResolverPath);

    // 加载解析器
    dpResolverDir.forEach(file => {
      require(path.join(baseResolverPath, file))(graphqlTC, schemaComposer);
    });

    const graphqlSchema = schemaComposer.buildSchema();
    Object.assign(app, { graphqlSchema, graphqlTC });
  });
};