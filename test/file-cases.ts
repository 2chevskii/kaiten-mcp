import type {ToolCase} from './tool-cases.ts';

export const cardUid = '11111111-1111-4111-8111-111111111111';
export const fileUid = '22222222-2222-4222-8222-222222222222';
export const commentUid = '33333333-3333-4333-8333-333333333333';
export const propertyUid = '44444444-4444-4444-8444-444444444444';
const file = {
  data_base64: 'AP9BQgo=',
  filename: 'fixture.bin',
  mime_type: 'application/octet-stream',
};
const multipart = {parts: [{name: 'file', ...file}]};
const metadata = {
  id: fileUid,
  name: 'fixture.bin',
  mime_type: 'application/octet-stream',
  size: '5',
  card_uid: cardUid,
  card_cover: false,
  extra: {retained: true},
};
const cardPath = `/cards/${cardUid}/files`;
const commentPath = `/cards/${cardUid}/comments/${commentUid}/files`;
const propertyPath = `/cards/${cardUid}/custom-properties/${propertyUid}/files`;

export const fileCases: ToolCase[] = [
  {
    name: 'cardFiles.attachFileToCard',
    args: {card_id: 10, file},
    method: 'PUT',
    path: '/cards/10/files',
    body: multipart,
    response: {id: 20, name: file.filename, size: 5},
  },
  {
    name: 'cardFiles.detachFileFromCard',
    args: {card_id: 10, file_id: 20},
    method: 'DELETE',
    path: '/cards/10/files/20',
    response: {id: 20},
  },
  {
    name: 'cardFiles.updateFile',
    args: {card_id: 10, file_id: 20, card_cover: false},
    method: 'PATCH',
    path: '/cards/10/files/20',
    body: {card_cover: false},
    response: {id: 20, card_cover: false},
  },
  {
    name: 'restrictedAccessCardFiles.attachFileToCard',
    args: {card_uid: cardUid, file},
    method: 'POST',
    path: cardPath,
    body: multipart,
    response: metadata,
  },
  {
    name: 'restrictedAccessCardFiles.getCardFile',
    args: {
      card_uid: cardUid,
      file_uid: fileUid,
      redirect: false,
      download: true,
    },
    method: 'GET',
    path: `${cardPath}/${fileUid}`,
    query: {redirect: 'false', download: 'true'},
    response: {...metadata, url: 'https://storage.invalid/signed'},
  },
  {
    name: 'restrictedAccessCardFiles.updateCardFile',
    args: {card_uid: cardUid, file_uid: fileUid, name: '', card_cover: false},
    method: 'PATCH',
    path: `${cardPath}/${fileUid}`,
    body: {name: '', card_cover: false},
    response: metadata,
  },
  {
    name: 'restrictedAccessCardFiles.deleteCardFile',
    args: {card_uid: cardUid, file_uid: fileUid},
    method: 'DELETE',
    path: `${cardPath}/${fileUid}`,
    response: {id: fileUid},
  },
  {
    name: 'restrictedAccessCommentFiles.attachFileToComment',
    args: {card_uid: cardUid, comment_uid: commentUid, file},
    method: 'POST',
    path: commentPath,
    body: multipart,
    response: {...metadata, comment_uid: commentUid},
  },
  {
    name: 'restrictedAccessCommentFiles.getCommentFile',
    args: {
      card_uid: cardUid,
      comment_uid: commentUid,
      file_uid: fileUid,
      query: {redirect: false, download: false},
    },
    method: 'GET',
    path: `${commentPath}/${fileUid}`,
    query: {redirect: 'false', download: 'false'},
    response: {...metadata, comment_uid: commentUid},
  },
  {
    name: 'restrictedAccessCommentFiles.updateCommentFile',
    args: {
      card_uid: cardUid,
      comment_uid: commentUid,
      file_uid: fileUid,
      body: {name: 'renamed.bin', card_cover: false},
    },
    method: 'PATCH',
    path: `${commentPath}/${fileUid}`,
    body: {name: 'renamed.bin', card_cover: false},
    response: {...metadata, comment_uid: commentUid},
  },
  {
    name: 'restrictedAccessCommentFiles.deleteCommentFile',
    args: {card_uid: cardUid, comment_uid: commentUid, file_uid: fileUid},
    method: 'DELETE',
    path: `${commentPath}/${fileUid}`,
    response: {id: fileUid},
  },
  {
    name: 'restrictedAccessCustomPropertyFiles.attachFileToCustomProperty',
    args: {card_uid: cardUid, property_uid: propertyUid, file},
    method: 'POST',
    path: propertyPath,
    body: multipart,
    response: {...metadata, custom_property_uid: propertyUid},
  },
  {
    name: 'restrictedAccessCustomPropertyFiles.getCustomPropertyFile',
    args: {
      card_uid: cardUid,
      property_uid: propertyUid,
      file_uid: fileUid,
      query: {download: true},
    },
    method: 'GET',
    path: `${propertyPath}/${fileUid}`,
    query: {download: 'true'},
    response: {...metadata, custom_property_uid: propertyUid},
  },
  {
    name: 'restrictedAccessCustomPropertyFiles.updateCustomPropertyFile',
    args: {
      card_uid: cardUid,
      property_uid: propertyUid,
      file_uid: fileUid,
      body: {},
    },
    method: 'PATCH',
    path: `${propertyPath}/${fileUid}`,
    body: {},
    response: {...metadata, custom_property_uid: propertyUid},
  },
  {
    name: 'restrictedAccessCustomPropertyFiles.deleteCustomPropertyFile',
    args: {card_uid: cardUid, property_uid: propertyUid, file_uid: fileUid},
    method: 'DELETE',
    path: `${propertyPath}/${fileUid}`,
    response: {id: fileUid},
  },
  {
    name: 'cardComments.addComment',
    args: {card_id: 10, body: {text: ''}},
    method: 'POST',
    path: '/cards/10/comments',
    body: {text: ''},
    response: {id: 30, uid: commentUid, text: '', attacments: [metadata]},
  },
  {
    name: 'cardComments.updateComment',
    args: {card_id: 10, comment_id: 30, body: {}},
    method: 'PATCH',
    path: '/cards/10/comments/30',
    body: {},
    response: {
      id: 30,
      uid: commentUid,
      text: 'unchanged',
      attachments: [metadata],
    },
  },
  {
    name: 'cardComments.retrieveCardComments',
    args: {card_id: 10},
    method: 'GET',
    path: '/cards/10/comments',
    response: [
      {id: 30, uid: commentUid, text: 'full text', attachments: [metadata]},
    ],
  },
  {
    name: 'cardComments.removeComment',
    args: {card_id: 10, comment_id: 30},
    method: 'DELETE',
    path: '/cards/10/comments/30',
    response: {id: 30},
  },
];
