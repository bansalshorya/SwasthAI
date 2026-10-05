import { APP_CONFIG } from "../config/appConfig";
import { FOLLOW_UP_BY_KEY } from "../config/followUpQuestions";
import { localize } from "../config/localize";

function Section({ title, children }) {
  return <section className="doctor-report-section"><h2>{title}</h2>{children}</section>;
}
function Lines({ items }) {
  return items?.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : null;
}

export default function DoctorReport({ session, result, language, copy, parent }) {
  const answers = session.inspection?.answers || {};
  const questions = [...APP_CONFIG.questions, ...(session.inspection?.followUpIds || [])
    .map((id) => FOLLOW_UP_BY_KEY.get(id))
    .filter(Boolean).map((item) => ({ ...item, key: `followUp_${item.key}` }))];
  const photos = session.inspection?.images || [];
  return (
    <article className="doctor-report-print">
      <h1>{copy.doctorReportTitle}</h1>
      <p>{new Date(session.createdAt).toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}</p>
      {parent && <p>{copy.followUpOf}: {new Date(parent.createdAt).toLocaleString(language === "hi" ? "hi-IN" : "en-IN")}</p>}
      <Section title={copy.reportPatientContext}>
        <p>{copy.caregiverTitle}: {copy[`relation_${answers.subjectRelation || "self"}`]}</p>
        <p>{copy.symptomsLabel}: {answers.symptoms}</p>
        <p>{copy.risk}: {copy[result.riskLevel] || result.riskLevel} · {copy.confidence}: {copy[result.confidence] || result.confidence}</p>
      </Section>
      <Section title={copy.reviewQuestionsSection}>
        <dl>{questions.map((question) => {
          const value = answers[question.key];
          const option = question.options.find((item) => item.value === value);
          return value ? <div key={question.key}><dt>{localize(question.title, language)}</dt><dd>{option ? localize(option.label, language) : value}</dd></div> : null;
        })}</dl>
        <p>{copy.currentMedicines}: {answers.medications || copy.notProvided}</p>
        <p>{copy.knownAllergies}: {answers.allergies || copy.notProvided}</p>
      </Section>
      <Section title={copy.reportPhotoEvidence}>
        <p>{result.imageConsistency?.explanation || result.imageAssessment}</p>
        {photos.length ? <div className="doctor-report-photos">{photos.map((image, index) => {
          const source = image.dataUrl || image.thumbnailDataUrl;
          return <figure key={image.id || index}>{source ? <img src={source} alt="" /> : <div className="missing-photo">{copy.photoNotSaved}</div>}<figcaption>{index + 1}. {image.stepId}</figcaption></figure>;
        })}</div> : <p>{copy.noPhotoAttached}</p>}
      </Section>
      <Section title={copy.reportAssessment}>
        <p>{result.summary}</p>
        <Lines items={result.possibleConditions?.map((item) => `${item.name}: ${item.reason}`)} />
        <Lines items={result.evidence} />
      </Section>
      <Section title={copy.reportNextSteps}>
        <p>{result.doctorRecommendation?.specialist}: {result.doctorRecommendation?.timeframe}</p>
        <Lines items={result.homeCare} />
        <h3>{localize(APP_CONFIG.results.redFlagsTitle, language)}</h3>
        <Lines items={result.redFlags} />
        <h3>{localize(APP_CONFIG.results.monitorTitle, language)}</h3>
        <Lines items={result.monitorSymptoms} />
      </Section>
      <p className="doctor-report-disclaimer">{result.disclaimer || copy.printDisclaimer}</p>
    </article>
  );
}
