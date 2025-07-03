import React, { useState } from "react";
import { toast } from "react-hot-toast";
import { db, auth } from "../../firebase"; // Adjust the import path as necessary
import { doc, getDoc } from "firebase/firestore";
import { createServiceRequest } from "../../serviceRequestsService";
import { useTranslation } from 'react-i18next';

const Services = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    volunteerField: "",
    professionalBackground: "",
    frequency: "",
    timing: "",
    days: [],
    settlement: "", // New field for settlement
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const volunteerFields = [
    t('service.fields.healthcare'), t('service.fields.education'), t('service.fields.technology'), t('service.fields.arts'), t('service.fields.socialServices'), t('service.fields.administration'),
    t('service.fields.consulting'), t('service.fields.mentoring'), t('service.fields.homeAssistance'), t('service.fields.transportation'), t('service.fields.publicity'), t('service.fields.health'),
    t('service.fields.teaching'), t('service.fields.highTech'), t('service.fields.tourism'), t('service.fields.safety'), t('service.fields.funds'), t('service.fields.craftsmanship'), t('service.fields.culture'),
  ];

  const timingOptions = [
    t('service.timing.onceMonth'), t('service.timing.onceTwoWeeks'), t('service.timing.onceWeek'), t('service.timing.twiceWeek'), t('service.timing.weekends'), t('service.timing.flexible'),
  ];

  const timeOptions = [t('service.time.morning'), t('service.time.noon'), t('service.time.evening')];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Form Data:", formData);
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error(t('service.errors.notLoggedIn'));
        setIsSubmitting(false);
        return;
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.exists() ? userDoc.data() : {};
      
      // Try different possible locations for settlement
      const userSettlement = userData.idVerification?.settlement || 
                           userData.settlement || 
                           userData.credentials?.settlement || "";
      console.log("User Settlement:", userSettlement);

      if (!userSettlement) {
        toast.error(t('service.errors.noSettlement'));
        setIsSubmitting(false);
        return;
      }

      const serviceRequestData = {
        ...formData,
        settlement: userSettlement, // Ensure settlement is included
        status: "pending",
      };

      await createServiceRequest(serviceRequestData);
      toast.success(t('service.success.created'));

      setFormData({
        title: "",
        description: "",
        location: "",
        volunteerField: "",
        professionalBackground: "",
        frequency: "",
        timing: "",
        days: [],
        settlement: userSettlement, // Reset settlement field
      });
      setIsSubmitting(false);
    } catch (error) {
      toast.error(t('service.errors.failedCreate'));
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-auto max-h-screen overflow-y-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">{t('service.title')}</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.title')}</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder={t('service.form.titlePlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.location')}</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder={t('service.form.locationPlaceholder')}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.volunteerField')}</label>
            <select
              name="volunteerField"
              value={formData.volunteerField}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">{t('service.form.selectField')}</option>
              {volunteerFields.map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.professionalBackground')}</label>
            <input
              type="text"
              name="professionalBackground"
              value={formData.professionalBackground}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder={t('service.form.professionalBackgroundPlaceholder')}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.frequency')}</label>
            <select
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">{t('service.form.selectFrequency')}</option>
              {timingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.timing')}</label>
            <select
              name="timing"
              value={formData.timing}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
            >
              <option value="">{t('service.form.selectTiming')}</option>
              {timeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('service.form.selectDays')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[t('service.days.sunday'), t('service.days.monday'), t('service.days.tuesday'), t('service.days.wednesday'), t('service.days.thursday'), t('service.days.friday')].map(day => (
              <div
                key={day}
                onClick={() =>
                  setFormData((prev) => {
                    const selectedDays = prev.days || [];
                    return {
                      ...prev,
                      days: selectedDays.includes(day)
                        ? selectedDays.filter(d => d !== day)
                        : [...selectedDays, day]
                    };
                  })
                }
                className={`cursor-pointer p-3 rounded-lg border-2 transition-all duration-200 flex flex-col items-center gap-2 hover:shadow-md ${
                  (formData.days || []).includes(day)
                    ? 'border-[#FFD966] bg-[#FFD966] bg-opacity-20'
                    : 'border-gray-300 hover:border-[#FFD966] hover:bg-gray-50'
                }`}
              >
                <span className={`text-sm font-medium ${(formData.days || []).includes(day) ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('service.form.description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="w-full p-2 border rounded"
            rows="3"
            placeholder={t('service.form.descriptionPlaceholder')}
            required
          ></textarea>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded-lg text-white font-bold ${
              isSubmitting ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {isSubmitting ? t('service.form.submitting') : t('service.form.createRequest')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Services;