const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: "senhabidiretoria",
    clientEmail: "firebase-adminsdk-fbsvc@senhabidiretoria.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDFmUhDQC0h6SmZ\npT8UG+4k3ak39d/V0/3AAw0gYFfNGqZow69jPTzZOs+lhgrnZ6eNp/QPQUlF3UGN\nDXU2Lk6/X7F6c+MkRBCahAUJo/d66axyUENbIsfChB7DyH+FQHrEPk4v8FozarpP\nBYzsHwu8fVTuetY1mbsJ6sQcfp/5KoNE2JdxTTg34GzD8/Zot93p9j+b1K1Qd+vh\ns7nEsO3KXMRnxOlJKpBgMQtkCNO4204ifW7yidppBd2UJuSw2uEEWoiS0RlSgR/L\n1yNGTfFIRQUQwbsIO681Nb9r9fb+GJu1/YgwP87VRymwP58i8RV3sigRPXmyKS1v\nYVKiTifpAgMBAAECggEALFPcoCmPdmIGEQ++/NXfMKoBQiqIUkHCVQbaNP8n8z0d\nQ7dSayLbuae12V4eqBbawa6B08JDm8as4+W2+7abt9bRy7Sfqg0S5HblYmpEJHCz\nXNmgoptE0OAuvqEF6nCymb+Ybqyur4Yr0XpfSMEWMuyy1uT7lP6ttOXTpMjLPmvj\n31DjpioWOXGZTybhw6CuGsa5qx8ytgeJRTIgoKRxQxGJKtE2VCaLmCJYBvrNNVF+\n9QGYwzYmhxxKLkiA942K01YU2w7+7fhtyDwIMcscOMqjKrPTTYeAo+rQIlOAkfID\nF4jSwNqgFIEJ4THKnaRAKCnr6ZPn7vl8kHJNQCPSYQKBgQDyoUbpwCHNyKLFoken\nadiAZa3z3RzSsGAdcHHyrieBJrxme9PzVe510Qw354sVbOlwQNz6LCOxW3S9ngWj\noIWqh/L3sSciBqxlrhUGUkj99I0r1YQvAsZ0QT98y3w28AUSgQOpGvW6RxVXZUki\n0yVl1MGvSJyTHdytNy5wI29HNQKBgQDQfMKyD8tThxljABkn+4WFXcBUoMnKuURt\n/6rrA6SW9dW3CH3GHIWxnnfPzn12IwNPMZxQ5BbMXHdvqpUGsh8xPzNt5avhsBGs\n5+v3K8By9ou5y7Z+qODoJhW9yKKnel9d/ywwVgFiQ/9aYrgm3EzbMhHMVotaN+rt\nvvUKXNzQZQKBgQDN0bXAEHYchLhfgpvaDlXUBW0c01Lh/zBpiLuAq+9jBaMIJL7V\nSu3wD5eXzNkVIcCcsslBhzP3/ab4OxZ5iXAaCx02tJaHrLWNw7CeHitBErS2nHd3\nEZmbgMYEbPFAATesTLj4OKB+llIqQwdZfVfaHDL5KFV6DvjmD0tbYRPCiQKBgFBq\n/zJtszD52In+XLW2aA9EVU6PYqbGhaWkS4oxMohkNNZP+Su0jsEvbemDLZOm97zR\nVwlAoaacOBmjg648gJmfVjgasgzwvDCkmLkTcD0n6kd1U2RRwcbqAdLdlBfjtOtt\n5N6UHh6IOfPkRkH/Ecou6vyVmVToYr7nvF8N6MKdAoGALg85VMmnpxaZTqu3BEvq\nM5CI9XmS85vwCO5JN8tqJPDYm6U/agyP2sB+Kub9kZ6vjScSmOVU9VM+wJA46lvN\ntfkgJXLhoHtZbuC4L0jaQboN+Xx1Jsg5rqo/MeqmswMbrwxjQYUj0GRO/sF04W+U\n37N36eT1dbyKOpJse3QRYBM=\n-----END PRIVATE KEY-----\n".replace(/\\n/g, '\n'),
  }),
});
async function clearSpam() {
  const snapshot = await admin.firestore().collection('logs').where('action', '==', 'login_or_session_refresh').get();
  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();
  console.log('Deleted ' + snapshot.size + ' spam logs.');
}
clearSpam();
