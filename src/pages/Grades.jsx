import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

export default function GradesView({ profile, isAdmin }) {
  const [grades, setGrades] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStudent, setSelectedStudent] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeValue, setGradeValue] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    fetchGrades();
    if (profile?.role === 'teacher' || isAdmin) {
      fetchStudents();
    }
  }, [profile]);

  const fetchGrades = async () => {
    let query = supabase.from("grades").select("*, teacher:profiles!teacher_id(full_name)");
    if (profile?.role === 'student') {
      query = query.eq("student_id", profile.id);
    }
    const { data, error } = await query.order("created_at", { ascending: false });
    if (!error) setGrades(data || []);
    setLoading(false);
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name, user_class").eq("role", "student");
    setStudents(data || []);
  };

  const submitGrade = async (e) => {
    e.preventDefault();
    if (!selectedStudent || !subject || !gradeValue) return alert("Fill in required fields!");

    const student = students.find(s => s.id === selectedStudent);
    const { error } = await supabase.from("grades").insert([{
      student_id: selectedStudent,
      teacher_id: profile.id,
      subject,
      grade_value: gradeValue,
      comment,
      class_name: student?.user_class || "General"
    }]);

    if (!error) {
      setShowModal(false);
      setSubject(""); setGradeValue(""); setComment("");
      fetchGrades();
    } else {
      alert(error.message);
    }
  };

  if (loading) return <div className="p-4">Loading grades...</div>;

  const canAssignGrades = profile?.role === "teacher" || isAdmin;
  const emptyMessage = canAssignGrades
    ? "Start by recording a student's result."
    : "Your grades and teacher feedback will appear here.";

  return (
    <div className="materials-container" style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 'clamp(1.12rem, 4.8vw, 1.4rem)' }}>📊 Academic Records</h2>
          <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Results, feedback and progress</p>
        </div>
        {canAssignGrades && (
          <button className="main-btn" style={{ width: 'auto', padding: '10px 16px', whiteSpace: 'nowrap' }} onClick={() => setShowModal(true)}>+ Assign Grade</button>
        )}
      </div>

      <div className="task-grid" style={grades.length === 0 ? { flex: 1, display: 'flex' } : undefined}>
        {grades.length === 0 ? (
          <div style={{ width: '100%', minHeight: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '28px 18px', border: '1px dashed #d9d3fb', borderRadius: '18px', background: 'linear-gradient(135deg, #faf9ff 0%, #f4f1ff 100%)' }}>
            <div style={{ width: '64px', height: '64px', display: 'grid', placeItems: 'center', marginBottom: '16px', borderRadius: '20px', background: 'linear-gradient(135deg, #7757e8, #9a69f5)', boxShadow: '0 10px 24px rgba(119, 87, 232, 0.24)', fontSize: '1.8rem' }}>📊</div>
            <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem' }}>No grades recorded yet.</strong>
            <p style={{ maxWidth: '290px', margin: '8px 0 0', color: 'var(--text-muted)', lineHeight: 1.55, fontSize: '0.92rem' }}>{emptyMessage}</p>
            {canAssignGrades && <button className="main-btn" style={{ width: 'auto', marginTop: '18px', padding: '10px 16px' }} onClick={() => setShowModal(true)}>+ Assign Grade</button>}
          </div>
        ) : grades.map(g => (
          <div key={g.id} className="task-item">
            <div className="task-info">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <strong style={{ fontSize: '1.1rem', color: 'var(--primary)' }}>{g.subject}</strong>
                  <p style={{ margin: '5px 0', fontSize: '0.9rem' }}>{g.comment || "No teacher comments."}</p>
                </div>
                <span className="status-badge status-approved" style={{ fontSize: '1.2rem', padding: '10px' }}>
                  {g.grade_value}
                </span>
              </div>
              <div style={{ marginTop: '10px', borderTop: '1px solid #eee', paddingTop: '5px' }}>
                <small style={{ color: 'var(--text-muted)' }}>
                  {profile?.role === 'teacher' ? `Student ID: ${g.student_id.slice(0,8)}...` : `Teacher: ${g.teacher?.full_name || 'Faculty'}`}
                </small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Assign New Grade</h3>
            <form onSubmit={submitGrade} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select className="main-input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} required>
                <option value="">Select Student</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name} ({s.user_class})</option>)}
              </select>
              <input className="main-input" placeholder="Subject (e.g. Math)" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <input className="main-input" placeholder="Grade (e.g. A, 19, 95%)" value={gradeValue} onChange={(e) => setGradeValue(e.target.value)} required />
              <textarea className="main-input" placeholder="Comments (Optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="submit" className="main-btn">Save Grade</button>
                <button type="button" className="main-btn" style={{ background: '#ccc' }} onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
