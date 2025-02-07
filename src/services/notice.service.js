import fs from 'fs';
import Notice from '../models/notice.model';
import FCSCSubscription from '../models/subscription.fcsc.model';
import MailService from './mail.service';
import ClientConst from '../constants/mail.constants';
import handlebars from 'handlebars';
import { validateFCSCRequest } from '../middleware/requestValidator';
import { ImageUpload, ImageDelete } from '../middleware/firebaseStorage';

/**
 * Create notice in db
 * @param req
 * @returns {Promise<Document<any>>}
 */

const addNotice = async (req, title, body, category, photo, createdAt) => {
  validateFCSCRequest(req);
  if (photo) {
    photo = await ImageUpload(photo, `noticeBanners/${title + ' ' + category}`);
  }
  const notice = new Notice({
    title,
    body,
    category,
    photo,
    createdAt,
  });

  const res = await notice.save();

  if (res) {
    const subscribedList = await FCSCSubscription.find();
    await Promise.all(
      subscribedList.map(async function (subscribedUser) {
        const html = fs.readFileSync(
          __basedir + '/html/emailTemplate.html',
          'utf8'
        );

        var template = handlebars.compile(html);
        var replacements = {
          title: 'NOTICE',
          text: title,
          boxText: body,
          buttonURL: 'https://fcsc-web.web.app/notices/',
          buttonText: "Check out what's new",
        };

        var htmlToSend = template(replacements);
        var mailOptions = {
          from: ClientConst.CREDENTIALS.USER,
          to: subscribedUser.email,
          subject: `FCSC Notice - ${title}`,
          html: htmlToSend,
        };
        await MailService.sendMail(mailOptions);
      })
    );
  }

  return true;
};

/**
 *
 * @param req
 * @returns {Promise<void>}
 */
const editNotice = async (req) => {
  validateFCSCRequest(req);
  const notice = await Notice.findById(req.params.id);
  if (req.body.photo != notice.photo) {
    req.body.photo = await ImageUpload(
      req.body.photo,
      `noticeBanners/${req.body.title + ' ' + req.body.category}`
    );
  }
  return Notice.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: false,
  });
};

/**
 *
 * @param req
 * @returns {Promise<void>}
 */
const deleteNotice = async (req) => {
  validateFCSCRequest(req);
  const notice = await Notice.findById(req.params.id);
  if (notice.photo.includes('https://firebasestorage.googleapis.com')) {
    await ImageDelete(notice.photo);
  }

  return Notice.findByIdAndDelete(req.params.id);
};

/**
 *
 * @param req
 * @returns {Promise<void>}
 */
const getNotices = () => {
  return Notice.find().sort({ createdAt: -1 });
};

export default {
  addNotice,
  editNotice,
  deleteNotice,
  getNotices,
};
