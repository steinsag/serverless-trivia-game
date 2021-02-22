/*
  Copyright 2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
  Permission is hereby granted, free of charge, to any person obtaining a copy of this
  software and associated documentation files (the "Software"), to deal in the Software
  without restriction, including without limitation the rights to use, copy, modify,
  merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so.
  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
  INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
  PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
  HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
  OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/
// SPDX-License-Identifier: MIT-0
// Function: player_put:app.js

/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const AWS = require('aws-sdk');

AWS.config.apiVersions = { dynamodb: '2012-08-10' };
AWS.config.update = ({ region: process.env.REGION });

const ddb = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const playersTable = process.env.PLAYER_TABLE_NAME;
const playerAvatarBucket = process.env.PLAYER_AVATAR_BUCKET;

async function savePlayer(playerId, playerItem) {
  let msg = {};
  if (playerItem.newavatar !== '') {
    const filekey = `${playerId}/avatar.jpg`;
    msg.signedurl = await s3.getSignedUrl('putObject', {
      Bucket: playerAvatarBucket,
      Key: filekey,
      ContentType: playerItem.fileType,
    }).promise();
    return { statusCode: 200, body: JSON.stringify(msg) };
  }
  const Item = {
    playerName: playerId,
    location: playerItem.location,
    realName: playerItem.realName,
  };
  try {
    msg = await ddb.put({
      TableName: playersTable,
      Item,
    }).promise();
    return { statuCode: 200, body: JSON.stringify(msg) };
  } catch (e) {
    console.error(`error saving player ${JSON.stringify(e.stack)}`);
    return { statuCode: 500, body: 'Error saving player' };
  }
}

exports.handler = async (event) => {
  const { playerId } = event.pathParameters;
  const playerItem = JSON.parse(event.body);
  const retVal = await savePlayer(playerId, playerItem);
  return retVal;
};
