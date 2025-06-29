import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Settlements = ({ settlements }) => {
  const { t } = useLanguage();

  return (
    <>
      <h2 className="text-2xl font-bold mt-12">{t('settlements.title')}</h2>
      <div className="bg-white shadow rounded overflow-hidden">
        <table className="min-w-full text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-4">{t('settlements.table.settlement')}</th>
              <th>{t('settlements.table.municipality')}</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {settlements.map((settlement, index) => (
              <tr key={index} className="border-t">
                <td className="p-4">{settlement.name}</td>
                <td>{settlement.municipality}</td>
                <td className="text-right pr-4 cursor-pointer text-gray-500 hover:text-yellow-500" title={t('settlements.actions.edit')}>✎</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default Settlements;
